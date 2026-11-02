import { beforeEach, describe, expect, it } from "vitest";
import { isLegacyMockId, purgeLegacyMockStorage } from "../tenant-preferences";
import { MemoryStorage } from "./test-storage";

const memoryStorage = new MemoryStorage();
if (typeof window === "undefined" || !window.localStorage) {
  (globalThis as unknown as { window: { localStorage: MemoryStorage }; localStorage: MemoryStorage }).window = {
    localStorage: memoryStorage,
  };
  (globalThis as unknown as { localStorage: MemoryStorage }).localStorage = memoryStorage;
}

describe("Tenant Preferences & Storage Safety (F22)", () => {
  beforeEach(() => {
    memoryStorage.clear();
  });

  it("identifies known historical mock IDs accurately", () => {
    expect(isLegacyMockId("mock-business-id-1234")).toBe(true);
    expect(isLegacyMockId("mock-location-id-1234")).toBe(true);
    expect(isLegacyMockId("mock-category-1")).toBe(true);
  });

  it("never falsely classifies legitimate 'Demo' business names or normal UUIDs as mock IDs", () => {
    expect(isLegacyMockId("Demo Electronics")).toBe(false);
    expect(isLegacyMockId("demo-electronics-ltd")).toBe(false);
    expect(isLegacyMockId("Dhaka Demo Flagship")).toBe(false);
    expect(isLegacyMockId("3fa85f64-5717-4562-b3fc-2c963f66afa6")).toBe(false);
    expect(isLegacyMockId(null)).toBe(false);
    expect(isLegacyMockId(undefined)).toBe(false);
  });

  it("preserves legitimate business preferences with 'demo' in their name during storage purge", () => {
    // Setup legitimate tenant preference with "demo" in the business name
    memoryStorage.setItem(
      "stpos:v1:pref:usr-1",
      JSON.stringify({
        businessId: "99999999-9999-9999-9999-999999999999",
        businessName: "Demo Electronics Ltd",
        locationId: "88888888-8888-8888-8888-888888888888",
        locationName: "Gulshan Demo Store",
      })
    );

    // Setup an unrelated origin key containing the word "demo"
    memoryStorage.setItem("unrelated_demo_key", "important_value");

    // Setup an actual mock ID key to be purged
    memoryStorage.setItem(
      "stpos:v1:pref:mock-user",
      JSON.stringify({
        businessId: "mock-business-id-1234",
      })
    );

    purgeLegacyMockStorage();

    // The legitimate "Demo Electronics Ltd" preference MUST remain intact
    const legitimatePref = memoryStorage.getItem("stpos:v1:pref:usr-1");
    expect(legitimatePref).not.toBeNull();
    expect(JSON.parse(legitimatePref!).businessName).toBe("Demo Electronics Ltd");

    // Unrelated origin keys must not be indiscriminately wiped
    expect(memoryStorage.getItem("unrelated_demo_key")).toBe("important_value");

    // Mock key should be purged
    expect(memoryStorage.getItem("stpos:v1:pref:mock-user")).toBeNull();
  });
});
