import type { Business, Location } from "@/types/domain";
import type { OfflineDatabase } from "../db/offline-db";
import { isOfflineUnlocked, isTrustedWorkspaceActive, verifyGrant } from "../core/grant";
import { getDeviceId, OfflineError } from "../core/scope";
import type { CatalogSnapshot, OfflinePermission } from "../core/types";

/** Names of this operator's prepared branches; this is not an all-business server listing. */
export async function readPreparedBusinesses(db: OfflineDatabase, userId: string): Promise<Business[]> {
  const deviceId = await getDeviceId(db);
  const profiles = (await db.permissions.toArray()).filter(profile => profile.scope.userId === userId && profile.scope.deviceId === deviceId);
  const authorized: Array<{ profile: OfflinePermission; snapshot: CatalogSnapshot }> = [];
  for (const profile of profiles) {
    try {
      const claims = await verifyGrant(profile.grantToken, profile.verificationKey, profile.scope);
      if (!claims.offlineIntakeAllowed) continue;
      const snapshot = await db.catalogSnapshots.get(profile.scopeKey);
      if (snapshot && snapshot.business.id === profile.scope.businessId && snapshot.location.id === profile.scope.locationId) authorized.push({ profile, snapshot });
    } catch { /* Exclude an expired, changed, or foreign capability; keep its saved data. */ }
  }
  const hasAuthorizedScope = await (async () => {
    for (const { profile } of authorized) {
      if (isOfflineUnlocked(profile.scope) || await isTrustedWorkspaceActive(db, profile.scope)) {
        return true;
      }
    }
    return false;
  })();
  if (!hasAuthorizedScope) throw new OfflineError("LOCAL_UNLOCK_REQUIRED", "Unlock your prepared offline register to see its businesses and branches.");
  const businesses = new Map<string, Business>();
  for (const { snapshot } of authorized) {
    const business = businesses.get(snapshot.business.id) ?? { ...snapshot.business, status: "ACTIVE" as const, locations: [] };
    const location: Location = { ...snapshot.location, businessId: snapshot.business.id, status: "ACTIVE" };
    if (!business.locations?.some(existing => existing.id === location.id)) business.locations!.push(location);
    businesses.set(business.id, business);
  }
  return [...businesses.values()];
}
