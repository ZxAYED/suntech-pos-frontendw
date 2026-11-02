import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { v4 as uuidv4 } from "uuid";
import { ApiClientError, type ApiErrorResponse, type ApiResponse } from "@/types/api";

type UnauthorizedHandler = () => void;
type RetryableConfig = InternalAxiosRequestConfig & { _sessionRetry?: boolean };

let handleUnauthorized: UnauthorizedHandler = () => undefined;
let refreshPromise: Promise<boolean> | null = null;

export function bindUnauthorizedHandler(handler: UnauthorizedHandler) {
  handleUnauthorized = handler;
}

const apiBaseUrl = typeof window !== "undefined"
  ? "/api/v1"
  : (process.env.SUNTECH_BACKEND_API_URL?.trim() ||
     process.env.BACKEND_API_URL?.trim() ||
     process.env.NEXT_PUBLIC_API_URL?.trim() ||
     "http://localhost:3000/api/v1").replace(/\/$/, "");

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 15_000,
});

const mutatingMethods = new Set(["post", "patch", "put", "delete"]);

apiClient.interceptors.request.use((config) => {
  const method = (config.method ?? "get").toLowerCase();
  if (mutatingMethods.has(method)) {
    if (!config.headers) {
      config.headers = new axios.AxiosHeaders();
    }
    const headers = config.headers as Record<string, unknown> & {
      get?: (name: string) => string | undefined;
      set?: (name: string, value: string) => void;
    };
    const existing =
      (typeof headers.get === "function"
        ? headers.get("Idempotency-Key") || headers.get("idempotency-key")
        : undefined) ||
      (headers["Idempotency-Key"] as string | undefined) ||
      (headers["idempotency-key"] as string | undefined);

    if (!existing || existing.trim() === "") {
      const generated =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : uuidv4();
      if (typeof headers.set === "function") {
        headers.set("Idempotency-Key", generated);
      } else {
        headers["Idempotency-Key"] = generated;
      }
    }
  }

  if (config.data instanceof FormData) {
    // Let browser / Axios determine multipart boundary automatically
    if (config.headers) {
      if (typeof (config.headers as { delete?: (name: string) => void }).delete === "function") {
        (config.headers as { delete: (name: string) => void }).delete("Content-Type");
      } else {
        delete (config.headers as Record<string, unknown>)["Content-Type"];
      }
    }
  } else if (config.data && config.headers) {
    const hasContentType =
      typeof (config.headers as { has?: (name: string) => boolean }).has === "function"
        ? (config.headers as { has: (name: string) => boolean }).has("Content-Type")
        : Boolean((config.headers as Record<string, unknown>)["Content-Type"]);
    if (!hasContentType) {
      if (typeof (config.headers as { set?: (name: string, value: string) => void }).set === "function") {
        (config.headers as { set: (name: string, value: string) => void }).set("Content-Type", "application/json");
      } else {
        (config.headers as Record<string, unknown>)["Content-Type"] = "application/json";
      }
    }
  }
  return config;
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
      .post(`${apiBaseUrl}/auth/refresh`, {}, { withCredentials: true, timeout: 15_000 })
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
    const respData = error.response?.data as (Record<string, unknown> & { code?: string }) | undefined;
    const message = (respData?.message as string) ?? error.message ?? "Request failed";
    const code = respData?.code;
    return Promise.reject(
      new ApiClientError(
        message,
        status,
        respData?.timestamp as string | undefined,
        respData?.errors as Record<string, string[]> | undefined,
        code,
        respData,
      ),
    );
  },
);
