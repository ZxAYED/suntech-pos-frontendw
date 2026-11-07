import { NextResponse } from "next/server";
import { getBackendApiOrigin } from "@/lib/server/backend-api-url";

async function handleWarmup() {
  let backendOrigin: string;
  try {
    backendOrigin = getBackendApiOrigin();
  } catch {
    // Silently return 204 if backend origin is not set yet
    return new NextResponse(null, { status: 204 });
  }

  // Ping backend root directly to wake up Render container
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    await fetch(`${backendOrigin}/`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    }).catch(() => null);
  } catch {
    // Completely silent: ignore errors, timeouts, or cold start latency
  } finally {
    clearTimeout(timeoutId);
  }

  // 204 No Content: completely silent, no response body
  return new NextResponse(null, { status: 204 });
}

export const GET = handleWarmup;
export const HEAD = handleWarmup;
