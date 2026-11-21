/* eslint-disable react-hooks/refs */
"use client";

import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useRef, type ReactNode } from "react";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import { bindUnauthorizedHandler } from "@/lib/api-client";
import { getQueryClient } from "@/lib/get-query-client";
import { clearAllAuthStorage, saveStoredUser } from "@/lib/auth-storage";
import { purgeLegacyMockStorage, tenantPreferences } from "@/lib/tenant-preferences";
import { hydrateAuth, logout } from "@/redux/actions/authActions";
import { hydrateDrafts } from "@/redux/actions/draftsActions";
import { loadSavedDrafts } from "@/redux/storage";
import { AUTH_UNAVAILABLE } from "@/redux/types";
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

    currentStore.dispatch(hydrateDrafts(loadSavedDrafts()));

    const unbind = bindUnauthorizedHandler(() => {
      clearAllAuthStorage();
      tenantPreferences.clearAll();
      purgeLegacyMockStorage();
      currentStore.dispatch(logout());
      queryClientRef.current?.clear();
      window.location.replace(`${window.location.origin}/login?reason=session-expired`);
    });
    const controller = new AbortController();
    void fetch("/api/session", { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (controller.signal.aborted || currentStore.getState().auth.hydrated) return;
        if (response.status === 401 || response.status === 403) {
          clearAllAuthStorage();
          tenantPreferences.clearAll();
          currentStore.dispatch(hydrateAuth(null));
          return;
        }
        if (!response.ok) throw new Error("Session unavailable");
        const session = await response.json();
        if (controller.signal.aborted || currentStore.getState().auth.hydrated) return;
        if (!session?.user?.id) throw new Error("Session unavailable");
        saveStoredUser(session.user);
        currentStore.dispatch(hydrateAuth(session));
      })
      .catch(() => {
        if (!controller.signal.aborted && !currentStore.getState().auth.hydrated) {
          currentStore.dispatch({ type: AUTH_UNAVAILABLE });
        }
      });
    return () => {
      controller.abort();
      unbind();
    };
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
