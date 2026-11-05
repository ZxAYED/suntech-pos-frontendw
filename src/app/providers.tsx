/* eslint-disable react-hooks/refs */
"use client";

import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useRef, type ReactNode } from "react";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import { bindUnauthorizedHandler } from "@/lib/api-client";
import { getQueryClient } from "@/lib/get-query-client";
import { clearStoredUser, getStoredUser, saveStoredUser } from "@/lib/auth-storage";
import { purgeLegacyMockStorage } from "@/lib/tenant-preferences";
import { hydrateAuth, logout } from "@/redux/actions/authActions";
import { createAppStore, type AppStore } from "@/redux/store";

export function Providers({ children }: { children: ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createAppStore();
  }

  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = getQueryClient();
  }

  useEffect(() => {
    purgeLegacyMockStorage();
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          void reg.unregister();
        }
      });
    }
    const currentStore = storeRef.current;
    if (!currentStore) return;

    // Fast-path client hydration from local storage to prevent layout flashes
    const cachedUser = getStoredUser();
    if (cachedUser) {
      currentStore.dispatch(hydrateAuth({ user: cachedUser }));
    }

    bindUnauthorizedHandler(() => {
      purgeLegacyMockStorage();
      clearStoredUser();
      currentStore.dispatch(logout());
      queryClientRef.current?.clear();
      window.location.replace(`${window.location.origin}/login?reason=session-expired`);
    });
    const controller = new AbortController();
    void fetch("/api/session", { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<{ user: import("@/types/domain").User }> : null)
      .then((session) => {
        if (session?.user) {
          saveStoredUser(session.user);
          currentStore.dispatch(hydrateAuth(session));
        } else {
          clearStoredUser();
          currentStore.dispatch(hydrateAuth(null));
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          clearStoredUser();
          currentStore.dispatch(hydrateAuth(null));
        }
      });
    return () => controller.abort();
  }, []);

  return (
    <Provider store={storeRef.current}>
      <QueryClientProvider client={queryClientRef.current}>
        {children}
        <Toaster richColors position="top-right" />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Provider>
  );
}
