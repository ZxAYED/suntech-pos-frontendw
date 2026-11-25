import { test, expect, type Page } from "@playwright/test";

type Evidence = {
  sales: Array<{ clientOrderId: string; wire: { orderType: string } }>;
  outbox: Array<{ clientOrderId: string; state: string }>;
  receipts: unknown[];
  drafts: Array<{ state: string }>;
};

async function evidence(page: Page): Promise<Evidence> {
  return (await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("suntech-pos-offline-v1");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const read = (table: string) =>
      new Promise<unknown[]>((resolve, reject) => {
        const request = db.transaction(table, "readonly").objectStore(table).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    const [sales, outbox, receipts, drafts] = await Promise.all(["localSales", "outbox", "receipts", "drafts"].map(read));
    db.close();
    return { sales, outbox, receipts, drafts };
  })) as Evidence;
}

async function waitForAutomaticReady(page: Page, path = "/pos/terminal") {
  await page.goto(path);
  await expect(page.getByLabel(/Connection status: Online/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Add Test Shirt Red to cart/ })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
}

async function sellCatalog(page: Page) {
  await page.getByRole("button", { name: /Add Test Shirt Red to cart/ }).click();
  const button = page.getByRole("button", { name: /^Complete sale/ });
  await expect(button).toBeEnabled();
  await button.click();
  await expect.poll(async () => (await evidence(page)).sales.length).toBeGreaterThan(0);
}

test.beforeEach(async ({ request }) => {
  await request.post("/__test/control", { data: { reset: true } });
});

test("online login automatically prepares offline mode without passphrases and syncs local-first checkout", async ({ page, request }) => {
  let durableBeforeUpload = false;
  await page.route("**/api/v1/orders/sync-v2", async (route) => {
    const body = route.request().postDataJSON() as { orders: Array<{ clientOrderId: string }> };
    const saved = await evidence(page);
    durableBeforeUpload =
      body.orders.every((order) => saved.sales.some((sale) => sale.clientOrderId === order.clientOrderId)) &&
      saved.receipts.length > 0;
    await route.continue();
  });

  await waitForAutomaticReady(page);
  // Ensure old manual passphrase prompts are absent from normal terminal view
  await expect(page.getByLabel("New offline passphrase")).toHaveCount(0);

  await sellCatalog(page);
  await expect.poll(async () => (await evidence(page)).outbox[0]?.state).toBe("SYNCED");
  expect(durableBeforeUpload).toBe(true);
  const state = await (await request.get("/__test/state")).json();
  expect(state.orders).toHaveLength(1);
  expect(state.calls.some((call: { path: string }) => ["/api/v1/orders/catalog", "/api/v1/orders/custom"].includes(call.path))).toBe(false);
});

test("cold starts offline on a deep link with both servers unavailable and restores workspace automatically", async ({ page, context, request }) => {
  await waitForAutomaticReady(page);
  await request.post("/__test/control", { data: { apiDown: true, frontendDown: true } });
  await context.setOffline(true);
  await page.close();

  const restarted = await context.newPage();
  await restarted.goto("/pos/terminal");
  // No offline passphrase screen: restores directly to POS register with Offline indicator
  await expect(restarted.getByLabel(/Connection status: Offline/)).toBeVisible();
  await expect(restarted.getByRole("button", { name: /Add Test Shirt Red to cart/ })).toBeVisible();

  await sellCatalog(restarted);
  await expect(restarted.getByLabel("Connection status: Offline · 1 pending")).toBeVisible();

  await restarted.reload();
  await expect(restarted.getByLabel("Connection status: Offline · 1 pending")).toBeVisible();
  expect((await evidence(restarted)).sales).toHaveLength(1);

  const cacheUrls = await restarted.evaluate(async () => {
    const urls: string[] = [];
    for (const key of await caches.keys()) {
      const cache = await caches.open(key);
      for (const request of await cache.keys()) urls.push(request.url);
    }
    return urls;
  });
  expect(cacheUrls.some((url) => url.includes("/api/") || url.includes("_rsc") || url.endsWith("/pos/terminal"))).toBe(false);

  // Reconnect triggers automatic background sync without clicking any manual Sync Now button
  await context.setOffline(false);
  await request.post("/__test/control", { data: { apiDown: false, frontendDown: false } });
  await restarted.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect.poll(async () => (await evidence(restarted)).outbox[0]?.state, { timeout: 25_000 }).toBe("SYNCED");
  await expect(restarted.getByLabel("Connection status: Online")).toBeVisible();
});

test("lost sync response preserves same ID and recovers automatically without duplicate sales", async ({ page, request }) => {
  await waitForAutomaticReady(page);
  await request.post("/__test/control", { data: { syncMode: "drop-once" } });
  await sellCatalog(page);
  await expect.poll(async () => (await evidence(page)).outbox[0]?.state).toBe("UNKNOWN");
  const original = (await evidence(page)).sales[0].clientOrderId;

  await expect.poll(async () => (await evidence(page)).outbox[0]?.state, { timeout: 25_000 }).toBe("SYNCED");
  const server = await (await request.get("/__test/state")).json();
  expect(server.orders).toHaveLength(1);
  expect(server.orders[0].clientOrderId).toBe(original);
});

test("custom sale works automatically offline and preserves whole-BDT tender separately", async ({ page, context, request }) => {
  await waitForAutomaticReady(page);
  await request.post("/__test/control", { data: { apiDown: true, frontendDown: true } });
  await context.setOffline(true);
  await page.goto("/pos/custom-sale");
  await expect(page.getByLabel(/Connection status: Offline/)).toBeVisible();

  const field = (label: string) => page.locator("label").filter({ hasText: label }).locator("xpath=../..").locator("input").first();
  await field("Product or service name").fill("Repair service");
  await field("Unit price (BDT)").fill("500");
  await field("Paid amount (BDT)").fill("1000");
  await expect(page.getByRole("button", { name: "Complete sale", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Complete sale", exact: true }).click();
  await expect.poll(async () => (await evidence(page)).sales.length).toBe(1);

  const records = await evidence(page);
  expect(records.sales[0].wire.orderType).toBe("CUSTOM");
  const receipt = records.receipts[0] as { order: { totalAmount: number; tenderedAmount: number; changeDue: number } };
  expect(receipt.order.totalAmount).toBe(500);
  expect(receipt.order.tenderedAmount).toBe(1000);
  expect(receipt.order.changeDue).toBe(500);
});

test("two open register tabs cannot complete one shared cart twice", async ({ page, context, request }) => {
  await waitForAutomaticReady(page);
  await request.post("/__test/control", { data: { syncMode: "unavailable" } });
  await page.getByRole("button", { name: /Add Test Shirt Red to cart/ }).click();
  await expect.poll(async () => (await evidence(page)).drafts.length).toBeGreaterThan(0);

  const second = await context.newPage();
  await second.goto("/pos/terminal");
  await expect(second.getByRole("button", { name: /^Complete sale/ })).toBeEnabled();
  await Promise.allSettled([
    page.getByRole("button", { name: /^Complete sale/ }).click({ timeout: 3000 }),
    second.getByRole("button", { name: /^Complete sale/ }).click({ timeout: 3000 }),
  ]);
  await expect.poll(async () => (await evidence(page)).sales.length).toBe(1);
  await expect.poll(async () => (await evidence(second)).sales.length).toBe(1);
  expect((await evidence(page)).receipts).toHaveLength(1);
});

test("responsive desktop, tablet and mobile viewports show zero horizontal overflow", async ({ page }) => {
  await waitForAutomaticReady(page);
  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  }
});

test("explicit logout blocks automatic offline restoration on restart while preserving saved sales", async ({ page, context, request }) => {
  await waitForAutomaticReady(page);
  await request.post("/__test/control", { data: { apiDown: true, frontendDown: true } });
  await context.setOffline(true);
  await sellCatalog(page);
  await expect(page.getByLabel("Connection status: Offline · 1 pending")).toBeVisible();
  await page.keyboard.press("Escape");

  await context.setOffline(false);
  await request.post("/__test/control", { data: { apiDown: false, frontendDown: false } });
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await page.waitForURL("**/login**");

  await request.post("/__test/control", { data: { apiDown: true, frontendDown: true } });
  await context.setOffline(true);
  await page.goto("/pos/terminal");
  await expect(page.getByRole("heading", { name: /Offline — Sign In Required/i })).toBeVisible();
  expect((await evidence(page)).sales).toHaveLength(1);
});

test("admin branch workspace prepares automatic offline mode, puts diagnostics in Help, and syncs offline sales", async ({ page, context, request }) => {
  await request.post("/__test/control", { data: { role: "ADMIN" } });
  await page.goto("/admin/select-business");
  await expect(page.getByText("Offline Test Shop")).toBeVisible();
  await page.getByRole("button", { name: "Select Business" }).click();
  await page.getByRole("button", { name: "Select Branch" }).click();
  await expect(page.getByLabel(/Connection status: Online/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Add Test Shirt Red to cart/ })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await page.getByRole("link", { name: "Help", exact: true }).click();
  await expect(page.getByText("Offline Maintenance, Backup & Recovery")).toBeVisible();

  await page.getByRole("link", { name: "Catalog Register", exact: true }).click();
  await request.post("/__test/control", { data: { apiDown: true, frontendDown: true } });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByLabel(/Connection status: Offline/)).toBeVisible();

  await sellCatalog(page);
  await expect(page.getByLabel("Connection status: Offline · 1 pending")).toBeVisible();

  await context.setOffline(false);
  await request.post("/__test/control", { data: { apiDown: false, frontendDown: false } });
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect.poll(async () => (await evidence(page)).outbox[0]?.state, { timeout: 25_000 }).toBe("SYNCED");
  await expect(page.getByLabel("Connection status: Online")).toBeVisible();
});
