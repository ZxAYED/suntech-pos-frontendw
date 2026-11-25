import type { Order, Product, Variant } from "@/types/domain";
import type { OfflineDatabase } from "../db/offline-db";
import type { BootstrapPayload, CatalogSnapshot, OfflineScope } from "./types";
import { OfflineError, scopeKey } from "./scope";

export async function publishBootstrap(db: OfflineDatabase, scope: OfflineScope, payload: BootstrapPayload & { products?: Array<Product & { variants: Variant[] }> }): Promise<CatalogSnapshot> {
  const manifest = payload?.manifest;
  if (!manifest || manifest.version !== 2 || manifest.complete !== true || !manifest.snapshotId ||
      manifest.scope.userId !== scope.userId || manifest.scope.businessId !== scope.businessId || manifest.scope.locationId !== scope.locationId || (manifest.scope.deviceId !== undefined && manifest.scope.deviceId !== scope.deviceId) ||
      payload.business?.id !== scope.businessId || payload.location?.id !== scope.locationId || payload.user?.id !== scope.userId ||
      !Number.isFinite(Date.parse(payload.serverTime)) || !Array.isArray(payload.categories) || !Array.isArray(payload.acceptedClientOrderIds) ||
      !(payload.acceptedIdsComplete === true || manifest.acceptedIdsComplete === true)) {
    throw new OfflineError("INCOMPLETE_SNAPSHOT", "The complete authorized shop download has not arrived. The previous saved catalog was kept.");
  }
  const nestedProducts = payload.categories.flatMap(category => category.products.map(product => ({ ...product, categoryId: category.id })));
  const productRows = payload.products ?? nestedProducts;
  const productIds = new Set<string>();
  const variantIds = new Set<string>();
  const categories = payload.categories.map(category => ({ id: category.id, name: category.name, slug: category.slug, description: category.description, isActive: category.isActive, updatedAt: category.updatedAt }));
  const products: Product[] = [];
  const variants: Variant[] = [];
  for (const product of productRows) {
    if (!product.id || productIds.has(product.id) || !Array.isArray(product.variants)) throw new OfflineError("INVALID_SNAPSHOT", "The downloaded product list contains a missing or repeated identity.");
    productIds.add(product.id);
    const { variants: productVariants, ...productData } = product;
    products.push(productData);
    for (const variant of productVariants) {
      if (!variant.id || variantIds.has(variant.id) || !Number.isSafeInteger(variant.sellingPrice) || variant.sellingPrice < 0 || !Number.isSafeInteger(variant.stock)) {
        throw new OfflineError("INVALID_SNAPSHOT", "The downloaded variants contain an invalid identity, price, or stock quantity.");
      }
      variantIds.add(variant.id);
      variants.push({ ...variant, productId: product.id, product: productData, isActive: variant.isActive !== false });
    }
  }
  if (new Set(categories.map(c => c.id)).size !== categories.length || categories.some(c => !c.id) || manifest.counts.categories !== categories.length || manifest.counts.products !== products.length || manifest.counts.variants !== variants.length) {
    throw new OfflineError("INCOMPLETE_SNAPSHOT", "The downloaded item counts do not match. The previous saved catalog was kept.");
  }
  const snapshot: CatalogSnapshot = {
    scopeKey: scopeKey(scope), snapshotId: manifest.snapshotId, serverTime: payload.serverTime, savedAt: new Date().toISOString(),
    categories, products, variants, business: payload.business, location: payload.location,
    history: payload.history ?? [], historyComplete: false, acceptedClientOrderIds: payload.acceptedClientOrderIds,
  };
  return db.transaction("rw", db.catalogSnapshots, db.stockOverlays, async () => {
    const current = await db.catalogSnapshots.get(snapshot.scopeKey);
    if (current && Date.parse(current.serverTime) > Date.parse(snapshot.serverTime)) return current;
    await db.catalogSnapshots.put(snapshot);
    // These identities came from the SAME server snapshot as stock. They are already reflected in its base.
    const included = new Set(snapshot.acceptedClientOrderIds);
    await db.stockOverlays.where("scopeKey").equals(snapshot.scopeKey).filter(row=>included.has(row.clientOrderId)).delete();
    return snapshot;
  });
}

export async function readCatalog(db: OfflineDatabase, scope: OfflineScope, filters: { search?: string; categoryId?: string; offset?: number; limit?: number } = {}) {
  return db.transaction("r", db.catalogSnapshots, db.stockOverlays, async () => {
  const snapshot = await db.catalogSnapshots.get(scopeKey(scope));
  if (!snapshot) throw new OfflineError("CATALOG_NOT_READY", "Prepare the complete shop catalog online first.");
  const search = (filters.search ?? "").trim().toLocaleLowerCase();
  const filtered = snapshot.variants.filter(variant => variant.isActive !== false &&
    (!filters.categoryId || filters.categoryId === "ALL" || variant.product?.categoryId === filters.categoryId) &&
    (!search || [variant.sku, variant.barcode, variant.name, variant.product?.name].some(value => value?.toLocaleLowerCase().includes(search))));
  const offset = Math.max(0, filters.offset ?? 0);
  const limit = Math.max(1, Math.min(1000, filters.limit ?? 30));
  const rows = filtered.slice(offset, offset + limit);
  const variants = await Promise.all(rows.map(async variant => {
    const deltas = await db.stockOverlays.where("[scopeKey+variantId]").equals([scopeKey(scope), variant.id]).toArray();
    return { ...variant, stock: variant.stock + deltas.reduce((sum, row) => sum + row.quantityDelta, 0) };
  }));
  return { categories: snapshot.categories, variants, total: filtered.length, savedAt: snapshot.savedAt, serverTime: snapshot.serverTime, snapshotId: snapshot.snapshotId };
  });
}

export interface LocalHistoryFilters {
  offset?: number; limit?: number; search?: string; status?: string; paymentMethod?: string;
  orderType?: string; from?: string; to?: string;
}
function matchesHistory(order: Order, filters: LocalHistoryFilters): boolean {
  if (filters.status && order.status !== filters.status) return false;
  if (filters.paymentMethod && order.paymentMethod !== filters.paymentMethod) return false;
  if (filters.orderType && order.type !== filters.orderType) return false;
  const instant = Date.parse(order.occurredAt ?? order.createdAt);
  if (filters.from && instant < Date.parse(filters.from)) return false;
  if (filters.to && instant > Date.parse(filters.to)) return false;
  const search = filters.search?.trim().toLocaleLowerCase();
  return !search || [order.invoiceNumber, order.customerName, order.customerPhone, ...order.lines.map(line => line.productName)].some(value => value?.toLocaleLowerCase().includes(search));
}

/** The cached server window is partial. Page/count all matching local records without loading the queue into React. */
export async function readLocalHistory(db: OfflineDatabase, scope: OfflineScope, filters: LocalHistoryFilters = {}) {
  return db.transaction("r", [db.catalogSnapshots, db.localSales, db.serverMappings, db.receipts, db.outbox], async () => {
  const key = scopeKey(scope);
  const offset = Math.max(0, filters.offset ?? 0);
  const limit = Math.max(1, Math.min(100, filters.limit ?? 20));
  const snapshot = await db.catalogSnapshots.get(key);
  type HistoryOrder = Order & { clientOrderId?: string; localStatus?: string };
  const serverByClientId = new Map<string, HistoryOrder>();
  const serverById = new Map<string, HistoryOrder>();
  for (const order of (snapshot?.history ?? []) as HistoryOrder[]) {
    serverById.set(order.id, order);
    if (order.clientOrderId) serverByClientId.set(order.clientOrderId, order);
  }
  const usedServerIds = new Set<string>();
  let total = 0;
  // Keep only enough rows for the requested page, while counting the rest in indexed bounded reads.
  const candidates: HistoryOrder[] = [];
  let cursor = 0;
  const collection = () => db.localSales.where("[scopeKey+occurredAt]").between([key, ""], [key, "\uffff"]).reverse();
  for (;;) {
    const batch = await collection().offset(cursor).limit(100).toArray();
    if (!batch.length) break;
    cursor += batch.length;
    const ids = batch.map(sale => sale.clientOrderId);
    const [mappings, receipts, states] = await Promise.all([db.serverMappings.bulkGet(ids), db.receipts.bulkGet(ids), db.outbox.bulkGet(ids)]);
    for (let index = 0; index < batch.length; index++) {
      const sale = batch[index]; const mapping = mappings[index];
      // A lost HTTP acknowledgment still deduplicates using clientOrderId from the complete server snapshot transaction.
      const confirmed = serverByClientId.get(sale.clientOrderId) ?? (mapping ? serverById.get(mapping.orderId) ?? mapping.order : undefined);
      if (confirmed) usedServerIds.add(confirmed.id);
      const source = confirmed ?? receipts[index]?.order;
      if (!source) continue;
      const row: HistoryOrder = { ...source, clientOrderId: sale.clientOrderId, localStatus: confirmed ? "SYNCED" : states[index]?.state === "NEEDS_REVIEW" ? "NEEDS_REVIEW" : "PENDING" };
      if (matchesHistory(row, filters)) {
        total++;
        if (candidates.length < offset + limit) candidates.push(row);
      }
    }
    if (batch.length < 100) break;
  }
  for (const order of serverById.values()) {
    if (!usedServerIds.has(order.id) && matchesHistory(order,filters)) { total++; candidates.push(order); }
  }
  candidates.sort((a,b) => (b.occurredAt ?? b.createdAt).localeCompare(a.occurredAt ?? a.createdAt) || b.id.localeCompare(a.id));
  return { orders: candidates.slice(offset,offset+limit), total, complete: false as const, savedAt: snapshot?.savedAt };
  });
}
