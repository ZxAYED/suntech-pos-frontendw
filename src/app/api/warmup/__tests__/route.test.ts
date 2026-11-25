import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, HEAD } from "../route";

vi.mock("next/server", async (importOriginal) => ({
  ...await importOriginal<typeof import("next/server")>(),
  connection: vi.fn(async () => {}),
}));

describe("Backend Warmup API Route (/api/warmup)", () => {
  const originalEnv = process.env.BACKEND_API_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.BACKEND_API_URL;
    else process.env.BACKEND_API_URL = originalEnv;
  });

  it.each([GET, HEAD])("returns a bodyless 204 without fetching if backend is unconfigured", async (handler) => {
    delete process.env.BACKEND_API_URL;
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await handler();
    expect(response.status).toBe(204);
    expect(response.body).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("silently returns 204 No Content when ping is dispatched", async () => {
    process.env.BACKEND_API_URL = "https://suntech-backend-chk7.onrender.com";

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    const response = await GET();
    expect(response.status).toBe(204);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://suntech-backend-chk7.onrender.com/",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("handles upstream latency or timeout silently without throwing", async () => {
    process.env.BACKEND_API_URL = "https://suntech-backend-chk7.onrender.com";

    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Render cold start timeout"));

    const response = await GET();
    expect(response.status).toBe(204);
  });
});
