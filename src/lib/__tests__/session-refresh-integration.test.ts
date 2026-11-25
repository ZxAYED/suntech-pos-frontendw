import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient, bindUnauthorizedHandler } from "../api-client";

function denied(config: InternalAxiosRequestConfig) {
  return new AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, undefined, {
    status: 401, statusText: "Unauthorized", headers: {}, config,
    data: { message: "Expired session" },
  });
}
function refreshRejected(status: number) {
  return new AxiosError("Refresh unavailable", "ERR_BAD_RESPONSE", undefined, undefined, {
    status, statusText: "Unavailable", headers: {}, config: {} as InternalAxiosRequestConfig, data: {},
  });
}

afterEach(() => vi.restoreAllMocks());

describe("Actual Axios interceptor session recovery", () => {
  it.each([undefined, 500, 503, 429])("does not force signout after temporary refresh failure %s", async status => {
    const onUnauthorized = vi.fn();
    const unbind = bindUnauthorizedHandler(onUnauthorized);
    vi.spyOn(axios, "post").mockRejectedValueOnce(status === undefined ? new AxiosError("Network unavailable") : refreshRejected(status));
    try {
      await expect(apiClient.get("/catalog/products", { adapter: async config => { throw denied(config); } })).rejects.toMatchObject({ status: 503, code: "SESSION_VERIFICATION_UNAVAILABLE" });
      expect(onUnauthorized).not.toHaveBeenCalled();
    } finally { unbind(); }
  });

  it("signs out only when the server rejects credentials", async () => {
    const onUnauthorized = vi.fn();
    const unbind = bindUnauthorizedHandler(onUnauthorized);
    vi.spyOn(axios, "post").mockRejectedValueOnce(refreshRejected(401));
    try {
      await expect(apiClient.get("/orders", { adapter: async config => { throw denied(config); } })).rejects.toMatchObject({ status: 401 });
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    } finally { unbind(); }
  });

  it("renews a session and replays a read once", async () => {
    vi.spyOn(axios, "post").mockResolvedValueOnce({ data: { refreshed: true } });
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      if (!config.headers.get("x-test-read-attempt")) {
        config.headers.set("x-test-read-attempt", "1");
        throw denied(config);
      }
      return { config, status: 200, statusText: "OK", headers: {}, data: { success: true, data: { id: "original-order" } } };
    });
    const response = await apiClient.get("/orders/original-order", { adapter });
    expect(response.data).toEqual({ id: "original-order" });
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  it("renews credentials without automatically replaying a financial mutation", async () => {
    const onUnauthorized = vi.fn();
    const unbind = bindUnauthorizedHandler(onUnauthorized);
    vi.spyOn(axios, "post").mockResolvedValueOnce({ data: { refreshed: true } });
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => { throw denied(config); });
    try {
      await expect(apiClient.post("/orders", { amount: 500 }, { adapter, headers: { "Idempotency-Key": "original-sale" } })).rejects.toMatchObject({ status: 401, code: "SESSION_RENEWED_RETRY_REQUIRED" });
      expect(adapter).toHaveBeenCalledTimes(1);
      expect(onUnauthorized).not.toHaveBeenCalled();
    } finally { unbind(); }
  });

  it("awaits the durable denial handler before settling unauthorized requests", async () => {
    let release: (() => void) | undefined;
    const onUnauthorized = vi.fn(() => new Promise<void>(resolve => { release = resolve; }));
    const unbind = bindUnauthorizedHandler(onUnauthorized);
    vi.spyOn(axios, "post").mockRejectedValue(refreshRejected(401));
    const settled = vi.fn();
    const request = apiClient.get("/orders", { adapter: async config => { throw denied(config); } });
    void request.catch(settled);
    try {
      await vi.waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1));
      expect(settled).not.toHaveBeenCalled();
      release?.();
      await expect(request).rejects.toMatchObject({ status: 401 });
      expect(settled).toHaveBeenCalledTimes(1);
    } finally { release?.(); unbind(); }
  });

  it("surfaces failed rejection persistence instead of pretending signout finished", async () => {
    const storageError = new Error("Rejection could not be saved; register remains locked");
    const unbind = bindUnauthorizedHandler(async () => { throw storageError; });
    vi.spyOn(axios, "post").mockRejectedValueOnce(refreshRejected(401));
    try {
      await expect(apiClient.get("/orders", { adapter: async config => { throw denied(config); } })).rejects.toBe(storageError);
    } finally { unbind(); }
  });

  it("shares a single refresh between concurrent unauthorized reads", async () => {
    let finishRefresh: ((value: unknown) => void) | undefined;
    const refresh = vi.spyOn(axios, "post").mockImplementationOnce(() => new Promise(resolve => { finishRefresh = resolve; }));
    const adapter = async (config: InternalAxiosRequestConfig) => {
      if (!config.headers.get("x-test-read-attempt")) {
        config.headers.set("x-test-read-attempt", "1");
        throw denied(config);
      }
      return { config, status: 200, statusText: "OK", headers: {}, data: [] };
    };
    const requests = Promise.all([apiClient.get("/orders", { adapter }), apiClient.get("/catalog/products", { adapter })]);
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    finishRefresh?.({ data: { refreshed: true } });
    await requests;
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
