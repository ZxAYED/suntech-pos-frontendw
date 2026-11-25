import { offlineDb } from "../db/offline-db";
import { readCatalog } from "../core/bootstrap";
import type { OfflineScope } from "../core/types";
import { scopeKey } from "../core/scope";

export async function findLocalVariant(scope: OfflineScope, barcode: string) {
  const snapshot = await offlineDb.catalogSnapshots.get(scopeKey(scope));
  const found = snapshot?.variants.find(variant => variant.barcode === barcode || variant.sku === barcode);
  if (!found) return undefined;
  const page = await readCatalog(offlineDb, scope, { search: found.sku || barcode, limit: 100 });
  return page.variants.find(variant => variant.id === found.id) || found;
}
