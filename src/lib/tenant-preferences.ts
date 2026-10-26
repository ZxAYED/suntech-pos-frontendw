const PREFIX = "stpos:v1";

function safeId(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return safeId(window.localStorage.getItem(key));
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    // Storage is an optional preference cache, never an authority boundary.
  }
}

export const tenantPreferences = {
  businessKey: (userId: string) => `${PREFIX}:${userId}:selectedBusinessId`,
  locationKey: (userId: string, businessId: string) =>
    `${PREFIX}:${userId}:${businessId}:selectedLocationId`,
  getBusinessId(userId: string) {
    return read(this.businessKey(userId));
  },
  setBusinessId(userId: string, businessId: string | null) {
    write(this.businessKey(userId), safeId(businessId));
  },
  getLocationId(userId: string, businessId: string) {
    return read(this.locationKey(userId, businessId));
  },
  setLocationId(userId: string, businessId: string, locationId: string | null) {
    write(this.locationKey(userId, businessId), safeId(locationId));
  },
};
