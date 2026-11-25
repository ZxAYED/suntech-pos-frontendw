import { describe, expect, it } from "vitest";
import { DELETE } from "../route";

describe("Local session deletion", () => {
  it("expires routing, access, and both historical refresh-cookie paths", async () => {
    const response = await DELETE();
    expect(await response.json()).toEqual({ signedOut: true });
    expect(response.cookies.get("suntech_session")).toMatchObject({ value: "", path: "/", maxAge: 0 });
    expect(response.cookies.get("accessToken")).toMatchObject({ value: "", path: "/", maxAge: 0 });
    expect(response.cookies.get("refreshToken")).toMatchObject({ value: "", path: "/api/v1/auth", maxAge: 0 });
    expect(response.headers.getSetCookie()).toContainEqual(expect.stringMatching(/^refreshToken=; Path=\/; Max-Age=0/));
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
