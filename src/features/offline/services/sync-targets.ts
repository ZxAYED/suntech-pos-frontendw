import type { OfflineDatabase } from "../db/offline-db";
import type { OfflineScope } from "../core/types";
import { scopeKey } from "../core/scope";
import { listRecoveredScopes } from "../core/backup";

/** Current branch first; never upload another operator's evidence. Backend
 * authorization still decides whether an old branch can be replayed. */
export async function listOperatorSyncScopes(db: OfflineDatabase, current: OfflineScope): Promise<OfflineScope[]> {
  const unique = new Map([[scopeKey(current), current]]);
  const prepared = await db.permissions.filter(row => row.scope.userId === current.userId).toArray();
  for (const scope of [...prepared.map(row => row.scope), ...await listRecoveredScopes(db, current.userId)]) {
    if (scope.userId === current.userId) unique.set(scopeKey(scope), scope);
  }
  return [...unique.values()];
}
