/* eslint-disable react-hooks/refs */
"use client";

import { MotionConfig } from "framer-motion";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { Toaster, toast } from "sonner";
import { bindUnauthorizedHandler } from "@/lib/api-client";
import { getQueryClient } from "@/lib/get-query-client";
import { clearAllAuthStorage, getStoredUser, saveStoredUser } from "@/lib/auth-storage";
import { purgeLegacyMockStorage, tenantPreferences } from "@/lib/tenant-preferences";
import { hydrateAuth, logout } from "@/redux/actions/authActions";
import { hydrateDrafts } from "@/redux/actions/draftsActions";
import { loadSavedDrafts } from "@/redux/storage";
import { AUTH_UNAVAILABLE } from "@/redux/types";
import { createAppStore, type AppStore } from "@/redux/store";
import { OfflineProvider } from "@/features/offline/ui/offline-provider";
import { offlineDb } from "@/features/offline/db/offline-db";
import { deactivateTrustedWorkspace, lockOffline, readTrustedWorkspace } from "@/features/offline/core/grant";
import { rejectOperatorPermissions } from "@/features/offline/services/reject-operator";
import { flushDrafts } from "@/features/offline/services/draft-flush";
import { ApiClientError } from "@/types/api";

export function Providers({ children }: { children: ReactNode }) {
  const [authRecoveryError, setAuthRecoveryError] = useState<string | null>(null);
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
    const currentStore = storeRef.current;
    if (!currentStore) return;

    currentStore.dispatch(hydrateDrafts(loadSavedDrafts()));

    const unbind = bindUnauthorizedHandler(async () => {
      const rejectedUserId = currentStore.getState().auth.user?.id ?? getStoredUser()?.id;
      window.dispatchEvent(new Event("suntech:lock"));
      try {
        await rejectOperatorPermissions(offlineDb, rejectedUserId);
        await deactivateTrustedWorkspace(offlineDb, "rejected", rejectedUserId ?? undefined);
        await flushDrafts();
      } catch {
        const message = "Your session was rejected and this register is locked. Recovery storage could not finish saving. Keep this page open and use administrator recovery before signing in again.";
        setAuthRecoveryError(message);
        toast.error(message, { duration: Infinity });
        throw new ApiClientError(message, 423, undefined, undefined, "AUTH_REJECTION_STORAGE_FAILED");
      }
      clearAllAuthStorage();
      tenantPreferences.clearAll();
      purgeLegacyMockStorage();
      currentStore.dispatch(logout());
      queryClientRef.current?.clear();
      window.location.replace(`${window.location.origin}/login?reason=session-expired`);
    });
    const controller = new AbortController();
    const hydrateFromSession = async () => {
      const response = await fetch("/api/session", { credentials: "same-origin", cache: "no-store", signal: controller.signal });
      if (controller.signal.aborted || currentStore.getState().auth.hydrated) return;
      if (response.status === 401 || response.status === 403) {
        const body = await response.json().catch(() => null) as { code?: string } | null;
        if (body?.code === "ROUTING_COOKIE_EXPIRED") {
          try {
            const refreshRes = await fetch("/api/v1/auth/refresh", {
              method: "POST",
              credentials: "same-origin",
              headers: { "Content-Type": "application/json" },
              body: "{}",
              signal: controller.signal,
            });
            if (controller.signal.aborted) return;
            if (refreshRes.ok) {
              const renewedRes = await fetch("/api/session", { credentials: "same-origin", cache: "no-store", signal: controller.signal });
              if (renewedRes.ok) {
                const renewedSession = await renewedRes.json();
                if (renewedSession?.user?.id && !controller.signal.aborted && !currentStore.getState().auth.hydrated) {
                  saveStoredUser(renewedSession.user);
                  currentStore.dispatch(hydrateAuth(renewedSession));
                  return;
                }
              }
            }
            if (refreshRes.status === 401 || refreshRes.status === 403) {
              const previousWs = await readTrustedWorkspace(offlineDb).catch(() => null);
              if (previousWs?.scope?.userId) {
                await rejectOperatorPermissions(offlineDb, previousWs.scope.userId).catch(() => undefined);
                await deactivateTrustedWorkspace(offlineDb, "rejected", previousWs.scope.userId).catch(() => undefined);
              }
              clearAllAuthStorage();
              tenantPreferences.clearAll();
              currentStore.dispatch(hydrateAuth(null));
              return;
            }
          } catch {
            // Backend unreachable while routing cookie expired -> attempt trusted offline workspace restoration.
          }
          if (!controller.signal.aborted && !currentStore.getState().auth.hydrated) {
            currentStore.dispatch({ type: AUTH_UNAVAILABLE });
          }
          return;
        }
        clearAllAuthStorage();
        tenantPreferences.clearAll();
        currentStore.dispatch(hydrateAuth(null));
        return;
      }
      if (!response.ok) throw new Error("Session unavailable");
      const session = await response.json();
      if (controller.signal.aborted || currentStore.getState().auth.hydrated) return;
      if (!session?.user?.id) throw new Error("Session unavailable");
      const existingWs = await readTrustedWorkspace(offlineDb).catch(() => null);
      if (existingWs?.scope?.userId && existingWs.scope.userId !== session.user.id) {
        lockOffline();
        tenantPreferences.clearAll(existingWs.scope.userId);
        await deactivateTrustedWorkspace(offlineDb, "account_switched").catch(() => undefined);
      }
      saveStoredUser(session.user);
      currentStore.dispatch(hydrateAuth(session));
    };
    void hydrateFromSession().catch(() => {
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
        <MotionConfig reducedMotion="never">
          <OfflineProvider>{children}</OfflineProvider>
        </MotionConfig>
        {authRecoveryError ? <div role="alertdialog" aria-modal="true" aria-label="Register recovery required" className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-6"><div className="max-w-lg rounded-xl border border-rose-200 bg-white p-6 text-sm text-rose-900"><h2 className="mb-3 font-semibold">Register locked — recovery required</h2><p>{authRecoveryError}</p></div></div> : null}
        <Toaster richColors position="top-right" />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Provider>
  );
}
