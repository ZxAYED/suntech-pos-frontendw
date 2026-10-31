const PREFIX = "stpos:v1";

const MOCK_BUSINESS_PATTERNS = [
  "biz-suntech",
  "biz-gadget",
  "biz-apex",
  "loc-doyel",
  "loc-bashundhara",
  "loc-jamuna",
  "loc-dhanmondi",
  "loc-gulshan",
  "mock",
  "demo",
];

function isMockIdentifier(val: string): boolean {
  const lower = val.toLowerCase();
  return MOCK_BUSINESS_PATTERNS.some((pattern) => lower.includes(pattern));
}

function safeId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || isMockIdentifier(trimmed)) return null;
  return trimmed;
}

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw && isMockIdentifier(raw)) {
      window.localStorage.removeItem(key);
      return null;
    }
    return safeId(raw);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value && !isMockIdentifier(value)) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    // Storage is an optional preference cache, never an authority boundary.
  }
}

export function purgeLegacyMockStorage() {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key) {
        const val = window.localStorage.getItem(key);
        if (
          isMockIdentifier(key) ||
          (val && isMockIdentifier(val))
        ) {
          keysToRemove.push(key);
        }
      }
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Restrictive storage environment fallback
  }
}

export interface StoredTenantContext {
  businessId: string;
  businessName: string;
  locationId?: string | null;
  locationName?: string | null;
}

export const tenantPreferences = {
  contextKey: (userId: string) => `${PREFIX}:${userId}:tenantContext`,
  businessKey: (userId: string) => `${PREFIX}:${userId}:selectedBusinessId`,
  businessNameKey: (userId: string) => `${PREFIX}:${userId}:selectedBusinessName`,
  locationKey: (userId: string, businessId?: string) =>
    businessId
      ? `${PREFIX}:${userId}:${businessId}:selectedLocationId`
      : `${PREFIX}:${userId}:selectedLocationId`,
  locationNameKey: (userId: string, businessId?: string) =>
    businessId
      ? `${PREFIX}:${userId}:${businessId}:selectedLocationName`
      : `${PREFIX}:${userId}:selectedLocationName`,

  getTenantContext(userId: string): StoredTenantContext | null {
    if (typeof window === "undefined" || !userId) return null;
    try {
      const raw = window.localStorage.getItem(this.contextKey(userId));
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredTenantContext>;
        if (parsed.businessId && !isMockIdentifier(parsed.businessId)) {
          return {
            businessId: parsed.businessId,
            businessName: parsed.businessName?.trim() || "Active Business",
            locationId: parsed.locationId && !isMockIdentifier(parsed.locationId) ? parsed.locationId : null,
            locationName: parsed.locationName?.trim() || null,
          };
        }
      }
      // Fallback to individual keys
      const bId = read(this.businessKey(userId));
      if (bId) {
        const bName = read(this.businessNameKey(userId)) ?? "Active Business";
        const lId = read(this.locationKey(userId, bId)) ?? read(this.locationKey(userId));
        const lName = (lId ? read(this.locationNameKey(userId, bId)) ?? read(this.locationNameKey(userId)) : null);
        return {
          businessId: bId,
          businessName: bName,
          locationId: lId ?? null,
          locationName: lName ?? null,
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  setTenantContext(
    userId: string,
    context: {
      business: { id: string; name: string };
      branch?: { id: string; name: string } | null;
    } | null,
  ) {
    if (typeof window === "undefined" || !userId) return;
    try {
      // Delete previous keys for this user to maintain strict consistency
      this.clearAll(userId);

      if (!context || !context.business.id || isMockIdentifier(context.business.id)) {
        return;
      }

      const bId = safeId(context.business.id);
      if (!bId) return;

      const bName = context.business.name.trim() || "Active Business";
      const lId = context.branch?.id ? safeId(context.branch.id) : null;
      const lName = context.branch?.name ? context.branch.name.trim() : null;

      const payload: StoredTenantContext = {
        businessId: bId,
        businessName: bName,
        locationId: lId,
        locationName: lName,
      };

      write(this.contextKey(userId), JSON.stringify(payload));
      write(this.businessKey(userId), bId);
      write(this.businessNameKey(userId), bName);

      if (lId) {
        write(this.locationKey(userId, bId), lId);
        write(this.locationKey(userId), lId);
        if (lName) {
          write(this.locationNameKey(userId, bId), lName);
          write(this.locationNameKey(userId), lName);
        }
      }
    } catch {
      // Storage fallback
    }
  },

  getBusinessId(userId: string) {
    const ctx = this.getTenantContext(userId);
    return ctx?.businessId ?? read(this.businessKey(userId));
  },

  getBusinessName(userId: string) {
    const ctx = this.getTenantContext(userId);
    return ctx?.businessName ?? read(this.businessNameKey(userId));
  },

  setBusinessId(userId: string, businessId: string | null, businessName?: string) {
    if (!businessId) {
      this.clearAll(userId);
      return;
    }
    const current = this.getTenantContext(userId);
    this.setTenantContext(userId, {
      business: {
        id: businessId,
        name: businessName || current?.businessName || "Active Business",
      },
      branch: current?.locationId ? {
        id: current.locationId,
        name: current.locationName || "Operational Branch",
      } : null,
    });
  },

  getLocationId(userId: string, businessId?: string) {
    const ctx = this.getTenantContext(userId);
    if (ctx?.locationId) return ctx.locationId;
    return read(this.locationKey(userId, businessId));
  },

  getLocationName(userId: string, businessId?: string) {
    const ctx = this.getTenantContext(userId);
    if (ctx?.locationName) return ctx.locationName;
    return read(this.locationNameKey(userId, businessId));
  },

  setLocationId(
    userId: string,
    businessId: string,
    locationId: string | null,
    locationName?: string,
  ) {
    const current = this.getTenantContext(userId);
    if (!locationId) {
      if (current) {
        this.setTenantContext(userId, {
          business: { id: current.businessId, name: current.businessName },
          branch: null,
        });
      } else {
        write(this.locationKey(userId, businessId), null);
        write(this.locationKey(userId), null);
      }
      return;
    }
    this.setTenantContext(userId, {
      business: {
        id: businessId,
        name: current?.businessName || "Active Business",
      },
      branch: {
        id: locationId,
        name: locationName || current?.locationName || "Operational Branch",
      },
    });
  },

  clearAll(userId?: string) {
    if (typeof window === "undefined") return;
    try {
      if (userId) {
        const userPrefix = `${PREFIX}:${userId}:`;
        const keysToDelete: string[] = [];
        for (let i = 0; i < window.localStorage.length; i += 1) {
          const key = window.localStorage.key(i);
          if (key && (key.startsWith(userPrefix) || key === `${PREFIX}:${userId}`)) {
            keysToDelete.push(key);
          }
        }
        for (const k of keysToDelete) {
          window.localStorage.removeItem(k);
        }
      }
      purgeLegacyMockStorage();
    } catch {
      // Storage fallback
    }
  },
};
