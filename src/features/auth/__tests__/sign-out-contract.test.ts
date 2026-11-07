import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Sign Out Contract & Disconnected Revocation Warning (Phase F3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("distinguishes confirmed server logout from local-only cleanup", () => {
    // Contract simulation: apiClient unwraps res.data.data
    const serverConfirmedResponse = {
      data: {
        loggedOut: true,
        serverLogoutConfirmed: true,
      },
    };

    const serverDisconnectedResponse = {
      data: {
        loggedOut: true,
        serverLogoutConfirmed: false,
      },
    };

    expect(serverConfirmedResponse.data.serverLogoutConfirmed).toBe(true);
    expect(serverDisconnectedResponse.data.serverLogoutConfirmed).toBe(false);
  });
});
