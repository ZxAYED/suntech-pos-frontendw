import type { AdvancedRecord } from "../core/advanced-commands";
import Dexie, { type Table } from "dexie";
import type { Category } from "@/types/domain";
import type { CartRecord, CatalogSnapshot, LocalReceipt, LocalSale, MetaRecord, OfflinePermission, OutboxRecord, ReviewRecord, ServerMapping, StockOverlay, SyncLease } from "../core/types";

export interface CategorySnapshot {
  key: string; userId: string; businessId: string; locationId: string; categories: Category[]; savedAt: string;
}

/** One additive schema. Never reset this database to fix a deployment or a login. */
export class OfflineDatabase extends Dexie {
  categorySnapshots!: Table<CategorySnapshot, string>;
  catalogSnapshots!: Table<CatalogSnapshot, string>;
  permissions!: Table<OfflinePermission, string>;
  drafts!: Table<CartRecord, string>;
  localSales!: Table<LocalSale, string>;
  receipts!: Table<LocalReceipt, string>;
  outbox!: Table<OutboxRecord, string>;
  stockOverlays!: Table<StockOverlay, string>;
  serverMappings!: Table<ServerMapping, string>;
  syncLeases!: Table<SyncLease, string>;
  metadata!: Table<MetaRecord, string>;
  reviews!: Table<ReviewRecord, string>;
  advancedCommands!: Table<AdvancedRecord, string>;

  constructor(name = "suntech-pos-offline-v1") {
    super(name);
    // Keep the original table/version so existing saved categories survive upgrade.
    this.version(1).stores({ categorySnapshots: "key" });
    this.version(2).stores({
      categorySnapshots: "key",
      catalogSnapshots: "scopeKey",
      permissions: "scopeKey",
      drafts: "key, scopeKey, [scopeKey+state]",
      localSales: "clientOrderId, scopeKey, [scopeKey+occurredAt], &cartFinalizationKey",
      receipts: "clientOrderId, scopeKey",
      outbox: "clientOrderId, scopeKey, [scopeKey+state+nextAttemptAt]",
      stockOverlays: "key, scopeKey, clientOrderId, [scopeKey+variantId]",
      serverMappings: "clientOrderId, scopeKey, orderId",
      syncLeases: "key",
      metadata: "key",
      reviews: "clientOrderId, scopeKey",
    });
    this.version(3).stores({ advancedCommands: "clientCommandId, scopeKey, entityKey, [scopeKey+state+nextAttemptAt]" });
    // Dexie closes this connection on versionchange; a future release upgrades additively.
  }
}
export const offlineDb = new OfflineDatabase();
