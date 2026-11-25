import type { OfflineDatabase } from "../db/offline-db";
import { lockOffline, markOfflinePermissionRejected } from "../core/grant";

/** A confirmed credential denial rejects only this operator, across prepared branches. */
export async function rejectOperatorPermissions(db: OfflineDatabase, userId?: string | null): Promise<void> {
  lockOffline();
  if (!userId) return;
  await db.transaction("rw", [db.permissions, db.metadata], async () => {
    const records = await db.permissions.filter(record => record.scope.userId === userId).toArray();
    for (const record of records) {
      await markOfflinePermissionRejected(db, record.scope, "The server rejected this operator's credentials. Sign in online to renew permission.");
    }
  });
}
