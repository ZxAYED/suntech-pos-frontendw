"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import { bindAuthSession } from "@/lib/api-client";
import { getQueryClient } from "@/lib/get-query-client";
import { AUTH_STORAGE_KEY } from "@/lib/utils";
import { logout } from "@/redux/actions/authActions";
import { createAppStore } from "@/redux/store";

export function Providers({ children }: { children: ReactNode }) {
  const [store] = useState(() => createAppStore());
  const [queryClient] = useState(() => getQueryClient());

  useEffect(() => {
    bindAuthSession(
      () => store.getState().auth.accessToken,
      () => {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        store.dispatch(logout());
        window.location.replace(`${window.location.origin}/login`);
      },
    );
  }, [store]);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors position="top-right" />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Provider>
  );
}
