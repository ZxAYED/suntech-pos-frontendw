import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { ApiClientError, type ApiErrorResponse, type ApiResponse } from "@/types/api";

type UnauthorizedHandler = () => void;
type RetryableConfig = InternalAxiosRequestConfig & { _sessionRetry?: boolean };

let handleUnauthorized: UnauthorizedHandler = () => undefined;
let refreshPromise: Promise<boolean> | null = null;

export function bindUnauthorizedHandler(handler: UnauthorizedHandler) {
  handleUnauthorized = handler;
}

export const apiClient = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

function isAuthLifecycleRequest(url = "") {
  return /\/auth\/(login|refresh|logout)$/.test(url);
}

function isSafeToReplay(method = "get") {
  return ["get", "head", "options"].includes(method.toLowerCase());
}

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post("/api/v1/auth/refresh", {}, { withCredentials: true, timeout: 15_000 })
      .then(() => true)
      .catch(() => false)
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => {
    if (response.config.responseType === "blob") return response;
    const payload = response.data as ApiResponse<unknown> | unknown;
    if (payload && typeof payload === "object" && "success" in payload && (payload as ApiResponse<unknown>).success === true && "data" in payload) {
      return { ...response, data: (payload as ApiResponse<unknown>).data };
    }
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const config = error.config as RetryableConfig | undefined;
    const status = error.response?.status ?? 0;
    if (status === 401 && config && !config._sessionRetry && !isAuthLifecycleRequest(config.url)) {
      if (isSafeToReplay(config.method)) {
        config._sessionRetry = true;
        if (await refreshSession()) return apiClient.request(config);
      }
      handleUnauthorized();
    }
    const message = error.response?.data?.message ?? error.message ?? "Request failed";
    return Promise.reject(new ApiClientError(message, status, error.response?.data?.timestamp, error.response?.data?.errors));
  },
);
