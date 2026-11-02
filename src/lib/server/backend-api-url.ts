if (typeof window !== "undefined") {
  throw new Error("backend-api-url.ts is server-only and cannot be executed in the browser");
}

export function getBackendApiOrigin(): string {
  const raw = process.env.BACKEND_API_URL?.trim() || process.env.SUNTECH_BACKEND_API_URL?.trim();
  if (!raw) {
    throw new Error("BACKEND_API_URL is required for the Next.js API proxy");
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("BACKEND_API_URL must be a valid http(s) origin");
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  ) {
    throw new Error("BACKEND_API_URL must be an http(s) origin without a path or credentials");
  }

  return url.origin;
}
