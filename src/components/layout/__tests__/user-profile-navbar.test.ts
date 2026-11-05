import { beforeEach, describe, expect, it } from "vitest";
import { getUserInitials } from "@/lib/user-utils";
import { clearStoredUser, getStoredUser, saveStoredUser } from "@/lib/auth-storage";
import { MemoryStorage } from "@/lib/__tests__/test-storage";
import type { User } from "@/types/domain";

const memoryStorage = new MemoryStorage();
if (typeof window === "undefined" || !window.localStorage) {
  (globalThis as unknown as { window: { localStorage: MemoryStorage }; localStorage: MemoryStorage }).window = {
    localStorage: memoryStorage,
  };
  (globalThis as unknown as { localStorage: MemoryStorage }).localStorage = memoryStorage;
}

describe("User Profile & Initials Utility (Navbar)", () => {
  it("computes 2-letter initials for multi-word names", () => {
    expect(getUserInitials("John Doe")).toBe("JD");
    expect(getUserInitials("Abu Zayed Khan")).toBe("AZ");
    expect(getUserInitials("Rahim Uddin")).toBe("RU");
  });

  it("computes 2-letter initials for short acronym names like 'ZX'", () => {
    expect(getUserInitials("ZX")).toBe("ZX");
    expect(getUserInitials("zx")).toBe("ZX");
  });

  it("computes 2-letter initials for single-word names", () => {
    expect(getUserInitials("Zayed")).toBe("ZA");
    expect(getUserInitials("Admin")).toBe("AD");
  });

  it("safely handles 1-character, empty, or undefined names", () => {
    expect(getUserInitials("Z")).toBe("Z");
    expect(getUserInitials("")).toBe("U");
    expect(getUserInitials(undefined)).toBe("U");
    expect(getUserInitials(null)).toBe("U");
  });
});

describe("Client Auth Profile Storage", () => {
  beforeEach(() => {
    memoryStorage.clear();
  });

  const mockUser: User = {
    id: "1ec1a3fa-e390-4727-b4e3-e47381526116",
    publicId: "ADM-Z6QJ7",
    fullName: "ZX",
    email: "zayed@yzcalo.com",
    phoneNumber: "+8801712345678",
    role: "ADMIN",
    status: "ACTIVE",
    businessId: "05a1572a-43ba-46df-a7bc-182ddfe835fd",
    locationId: null,
    profileImageUrl: "https://res.cloudinary.com/dhl04adhz/image/upload/v1792655332/suntech/users/1ec1a3fa-e390-4727-b4e3-e47381526116/zzyjywmtlxbichthsrzv.jpg",
    profileImagePublicId: "suntech/users/1ec1a3fa-e390-4727-b4e3-e47381526116/zzyjywmtlxbichthsrzv",
    profileImageKey: null,
  };

  it("persists and restores complete user profile in local storage", () => {
    saveStoredUser(mockUser);
    const restored = getStoredUser();

    expect(restored).not.toBeNull();
    expect(restored?.id).toBe(mockUser.id);
    expect(restored?.fullName).toBe("ZX");
    expect(restored?.role).toBe("ADMIN");
    expect(restored?.profileImageUrl).toBe(mockUser.profileImageUrl);
    expect(restored?.email).toBe("zayed@yzcalo.com");
  });

  it("clears user profile on clearStoredUser", () => {
    saveStoredUser(mockUser);
    expect(getStoredUser()).not.toBeNull();

    clearStoredUser();
    expect(getStoredUser()).toBeNull();
  });
});
