/* eslint-disable react-hooks/refs */
"use client";

import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useRef, type ReactNode } from "react";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import { bindAuthSession } from "@/lib/api-client";
import { getQueryClient } from "@/lib/get-query-client";
import { AUTH_STORAGE_KEY } from "@/lib/utils";
import { clearAuthCookies } from "@/lib/auth-cookie";
import { logout } from "@/redux/actions/authActions";
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
    const currentStore = storeRef.current;
    if (!currentStore) return;

    bindAuthSession(
      () => currentStore.getState().auth.accessToken,
      () => {
        const token = currentStore.getState().auth.accessToken;
        if (token) {
          clearAuthCookies();
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
          currentStore.dispatch(logout());
          window.location.replace(`${window.location.origin}/login`);
        } else {
          console.warn("[Auth] 401 response handled while in preview mode without token.");
        }
      },
    );
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
