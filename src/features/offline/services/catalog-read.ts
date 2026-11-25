import type { OfflineDatabase } from "../db/offline-db";
import type { OfflineScope } from "../core/types";
import { OfflineError, scopeKey } from "../core/scope";
import { verifySavedPermission } from "../core/grant";
import type { Category, Product, Variant } from "@/types/domain";

export function catalogReadScope(current: OfflineScope | null, userId: string, requested: { businessId?: string; locationId?: string }): OfflineScope {
  if (!current || current.userId !== userId || (requested.businessId && requested.businessId !== current.businessId) ||
      (requested.locationId && requested.locationId !== current.locationId)) {
    throw new OfflineError("CATALOG_SCOPE_MISMATCH", "Choose and unlock this operator's prepared branch before reading its saved catalog.");
  }
  return current;
}

export async function readOfflineCatalog(db: OfflineDatabase, current: OfflineScope | null, userId: string, requested: { businessId?: string; locationId?: string }) {
  const scope = catalogReadScope(current, userId, requested);
  await verifySavedPermission(db, scope, "OFFLINE");
  return db.transaction("r", db.catalogSnapshots, db.stockOverlays, async () => {
  const key = scopeKey(scope);
  const snapshot = await db.catalogSnapshots.get(key);
  if (!snapshot) throw new OfflineError("CATALOG_NOT_READY", "Download the complete catalog while online first.");
  const deltas = new Map<string, number>();
  await db.stockOverlays.where("scopeKey").equals(key).each(row => deltas.set(row.variantId, (deltas.get(row.variantId) ?? 0) + row.quantityDelta));
  const variants: Variant[] = snapshot.variants.filter(variant => variant.isActive !== false).map(variant => ({ ...variant, stock: variant.stock + (deltas.get(variant.id) ?? 0) }));
  const variantsByProduct = new Map<string, Variant[]>();
  for (const variant of variants) {
    const rows = variantsByProduct.get(variant.productId) ?? [];
    rows.push(variant); variantsByProduct.set(variant.productId, rows);
  }
  const products: Product[] = snapshot.products.filter(product => product.isActive !== false).map(product => ({ ...product, variants: variantsByProduct.get(product.id) ?? [], variantsCount: variantsByProduct.get(product.id)?.length ?? 0 }));
  const categories: Category[] = snapshot.categories.map(category => {
    const categoryProducts = products.filter(product => product.categoryId === category.id);
    const categoryVariants = categoryProducts.flatMap(product => product.variants ?? []);
    return { ...category, productsCount: categoryProducts.length, activeSkus: categoryVariants.length,
      totalUnits: categoryVariants.reduce((sum, variant) => sum + variant.stock, 0),
      inventoryValue: categoryVariants.reduce((sum, variant) => sum + variant.stock * variant.sellingPrice, 0) };
  });
  const units = variants.reduce((sum, variant) => sum + variant.stock, 0);
  const lowStock = variants.filter(variant => variant.stock <= 5).length;
  const inventoryValue = variants.reduce((sum, variant) => sum + variant.stock * (variant.costPrice ?? variant.sellingPrice), 0);
  return { categories, products, variants, savedAt: snapshot.savedAt,
    summary: { products: products.length, units, unitsInBranch: units, lowStock, lowStockSkus: lowStock, inventoryValue, value: inventoryValue, currency: "BDT" } };
  });
}

export function filterOfflineVariants(variants: Variant[], filters: { categoryId?: string; search?: string }, offset = 0, limit = 30) {
  const term = filters.search?.trim().toLocaleLowerCase();
  return variants.filter(variant =>
    (!filters.categoryId || filters.categoryId === "ALL" || (variant.categoryId ?? variant.product?.categoryId) === filters.categoryId) &&
    (!term || [variant.name, variant.sku, variant.barcode, variant.productName, variant.product?.name].some(value => value?.toLocaleLowerCase().includes(term))),
  ).slice(offset, offset + limit);
}

export function requireOnlineEdit(mode: string, online = typeof navigator === "undefined" || navigator.onLine) {
  if (mode === "OFFLINE" || !online) throw new OfflineError("ONLINE_EDIT_REQUIRED", "This edit needs an internet connection. Nothing was changed or queued. Saved sales remain safe.");
}
