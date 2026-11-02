import axios, {
  type InternalAxiosRequestConfig,
} from "axios";
import {
  ApiClientError,
  type ApiErrorResponse,
  type ApiResponse,
} from "@/types/api";

type UnauthorizedHandler = () => void;
type RetryableConfig = InternalAxiosRequestConfig & {
  _sessionRetried?: boolean;
};

let unauthorizedHandler: UnauthorizedHandler | null = null;
let refreshPromise: Promise<boolean> | null = null;

export function bindUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler;
  // Existing callers may ignore this return value; React effects can use it.
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null;
  };
}

// Browser -> Next same-origin BFF. No public URL env variable needed here.
export const apiClient = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  timeout: 15_000,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window === "undefined" && process.env.NODE_ENV !== "test" && !process.env.VITEST) {
    throw new Error(
      "src/lib/api-client.ts is browser-only and cannot execute requests in server context. Use server proxy or backend helpers instead.",
    );
  }
  return config;
});

function isAuthRequest(url = "") {
  return /(?:^|\/)auth\//.test(url);
}

function isReadRequest(method = "get") {
  return ["get", "head", "options"].includes(method.toLowerCase());
}

// Single-flight for concurrent 401s in this tab. The backend/BFF must keep
// the HttpOnly cookies and Next routing-session cookie in sync.
async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post("/api/v1/auth/refresh", {}, {
        withCredentials: true,
        timeout: 15_000,
      })
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => {
    // Never try to unwrap downloads.
    if (["blob", "arraybuffer", "stream"].includes(response.config.responseType ?? "")) {
      return response;
    }

    const payload = response.data as ApiResponse<unknown> | undefined;
    if (
      payload &&
      typeof payload === "object" &&
      payload.success === true &&
      Object.prototype.hasOwnProperty.call(payload, "data")
    ) {
      response.data = payload.data;
    }
    return response;
  },
  async (error: unknown) => {
    if (!axios.isAxiosError<ApiErrorResponse>(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status ?? 0;
    const config = error.config as RetryableConfig | undefined;
    const responseBody = error.response?.data;

    if (
      status === 401 &&
      config &&
      !config._sessionRetried &&
      !isAuthRequest(config.url)
    ) {
      config._sessionRetried = true;
      const refreshed = await refreshSession();

      if (refreshed) {
        // Reads can be replayed. NEVER automatically replay a sale/refund/
        // payroll/advance/stock write after an uncertain outcome.
        if (isReadRequest(config.method)) {
          return apiClient.request(config);
        }

        return Promise.reject(
          new ApiClientError(
            "Session renewed. This action was not repeated. Check its status before retrying.",
            401,
            responseBody?.timestamp,
            responseBody?.errors,
          ),
        );
      }
    }

    if (status === 401 && !isAuthRequest(config?.url)) {
      unauthorizedHandler?.();
    }

    const rawMessage: unknown = responseBody?.message;
    const message =
      typeof rawMessage === "string"
        ? rawMessage
        : Array.isArray(rawMessage)
          ? rawMessage.filter((val): val is string => typeof val === "string").join(", ")
          : error.message || "Request failed";

    const code = (responseBody as Record<string, unknown> | undefined)?.code as string | undefined;

    return Promise.reject(
      new ApiClientError(
        message,
        status,
        responseBody?.timestamp,
        responseBody?.errors,
        code,
        responseBody as Record<string, unknown> | undefined,
      ),
    );
  },
);
