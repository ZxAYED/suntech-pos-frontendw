import type { Category } from "@/types/domain";
import { offlineDb } from "./offline-db";

type CacheScope = { userId: string; businessId: string; locationId: string };

/** Legacy category cache remains readable; a category response is never a complete offline catalog. */
export async function cacheCategories(scope: CacheScope, categories: Category[]): Promise<void> {
  if (!scope.userId || !scope.businessId || !scope.locationId || !Array.isArray(categories)) {
    throw new Error("Invalid category cache data or scope");
  }
  await offlineDb.categorySnapshots.put({
    key: JSON.stringify([scope.userId, scope.businessId, scope.locationId]),
    ...scope, categories, savedAt: new Date().toISOString(),
  });
}
