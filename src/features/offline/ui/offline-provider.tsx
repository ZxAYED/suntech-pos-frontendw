"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { liveQuery } from "dexie";
import { useDispatch, useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { offlineDb } from "../db/offline-db";
import { getDeviceId, OfflineError, scopeKey } from "../core/scope";
import {
  assertOfflineLockGeneration,
  installProvisioning,
  lockOffline,
  markOfflinePermissionRejected,
  offlineLockGeneration,
  readTrustedWorkspace,
  verifySavedPermission,
} from "../core/grant";
import { drainSync } from "../core/sync";
import { drainAdvancedCommands } from "../core/advanced-commands";
import type { AdvancedCommand } from "../core/advanced-wire";
import type { GrantClaims, OfflinePermission, OfflineScope, ProvisioningResponse, SyncResult } from "../core/types";
import { apiClient } from "@/lib/api-client";
import { ApiClientError } from "@/types/api";
import type { RootState } from "@/redux/types";
import { hydrateAuth, logout } from "@/redux/actions/authActions";
import { setTenantSelection } from "@/redux/actions/tenantActions";
import { saveStoredUser, clearAllAuthStorage } from "@/lib/auth-storage";
import { tenantPreferences } from "@/lib/tenant-preferences";
import { OfflineStatus } from "./offline-status";
import { OfflineRecovery } from "./offline-recovery";
import { flushDrafts } from "../services/draft-flush";
import { listOperatorSyncScopes } from "../services/sync-targets";

export type OfflineMode = "ONLINE" | "OFFLINE" | "LOCKED" | "SETUP";

interface OfflineContextValue {
  scope: OfflineScope | null;
  mode: OfflineMode;
  ready: boolean;
  syncing: boolean;
  error: string | null;
  revision: number;
  pending: number;
  review: number;
  claims: GrantClaims | null;
  refresh: () => Promise<void>;
  syncNow: () => Promise<void>;
  resumeOffline: (scope: OfflineScope) => Promise<void>;
}

const empty: OfflineContextValue = {
  scope: null,
  mode: "SETUP",
  ready: false,
  syncing: false,
  error: null,
  revision: 0,
  pending: 0,
  review: 0,
  claims: null,
  refresh: async () => {},
  syncNow: async () => {},
  resumeOffline: async () => {},
};

const OfflineContext = createContext<OfflineContextValue>(empty);
export const useOffline = () => useContext(OfflineContext);

const CONFIG_PROVISION_CODES = new Set([
  "OFFLINE_SIGNING_INVALID",
  "OFFLINE_SIGNING_NOT_CONFIGURED",
  "OFFLINE_POLICY_INVALID",
  "OFFLINE_INTAKE_DISABLED",
  "OFFLINE_ROLE_FORBIDDEN",
  "OFFLINE_SCOPE_MISMATCH",
  "OFFLINE_SCOPE_REVOKED",
]);

function isNetworkOrOutageFailure(cause: unknown): boolean {
  if (!(cause instanceof ApiClientError)) return true;
  if (cause.code && CONFIG_PROVISION_CODES.has(cause.code)) return false;
  if (cause.code === "SESSION_VERIFICATION_UNAVAILABLE") return true;
  return cause.status === 0 || cause.status === 408 || cause.status === 502 || cause.status === 503 || cause.status === 504;
}

/** Public worker only; normal authenticated reads/writes continue through the BFF. */
export function OfflineProvider({ children }: { children: ReactNode }) {
  const auth = useSelector((state: RootState) => state.auth);
  const tenant = useSelector((state: RootState) => state.tenant);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [mode, setMode] = useState<OfflineMode>("SETUP");
  const [claims, setClaims] = useState<GrantClaims | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [revision, setRevision] = useState(0);
  const [counts, setCounts] = useState({ pending: 0, review: 0, advancedPending: 0, scopeKey: "" });
  const [recoveryProfile, setRecoveryProfile] = useState<OfflinePermission | null>(null);
  const [restoreComplete, setRestoreComplete] = useState(false);

  const busy = useRef<Promise<void> | null>(null);
  const syncing = useRef<AbortController | null>(null);
  const inFlightRefresh = useRef<{ key: string; promise: Promise<void> } | null>(null);
  const lastSyncAttempt = useRef(0);
  const refreshGeneration = useRef(0);

  const selected = auth.user?.role === "ADMIN" && auth.user?.id ? tenantPreferences.getTenantContext(auth.user.id) : null;
  const businessId = auth.user?.role === "ADMIN" ? tenant.selectedBusiness?.id || selected?.businessId : auth.user?.businessId;
  const locationId = auth.user?.role === "ADMIN" ? tenant.selectedBranch?.id || selected?.locationId : auth.user?.locationId;
  const userId = auth.user?.id;

  const scope = useMemo<OfflineScope | null>(
    () => (userId && businessId && locationId && deviceId ? { userId, businessId, locationId, deviceId } : null),
    [userId, businessId, locationId, deviceId],
  );

  const matchesScope = Boolean(scope && claims && scopeKey(scope) === scopeKey(claims));
  const visibleMode = (mode === "ONLINE" || mode === "OFFLINE") && !matchesScope ? "SETUP" : mode;
  const currentScope = useRef(scope);

  useEffect(() => {
    refreshGeneration.current += 1;
    currentScope.current = scope;
    return () => {
      syncing.current?.abort();
    };
  }, [scope]);

  // Initialize stable device identity, register service worker, and listen for cross-tab auth locks
  useEffect(() => {
    let disposed = false;
    void getDeviceId(offlineDb)
      .then((id) => {
        if (!disposed) setDeviceId(id);
      })
      .catch((cause) => {
        if (!disposed) {
          setError(`Device storage unavailable: ${cause instanceof Error ? cause.message : String(cause)}`);
        }
      });

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/suntech-sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          /* Missing installation leaves normal online routes running; never clears saved sales. */
        });
    }

    const applyWorkspaceLock = () => {
      refreshGeneration.current++;
      syncing.current?.abort();
      lockOffline();
      setMode("LOCKED");
      setClaims(null);
      setRecoveryProfile(null);
    };

    const handleLocalLock = () => applyWorkspaceLock();
    const handleStorageLock = (event: StorageEvent) => {
      if (event.key === "stpos_workspace_auth_event" && event.newValue) {
        applyWorkspaceLock();
        clearAllAuthStorage();
        tenantPreferences.clearAll();
        dispatch(logout());
        if (window.location.pathname !== "/login") {
          window.location.replace(`${window.location.origin}/login`);
        }
      }
    };

    let channel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      try {
        channel = new BroadcastChannel("suntech-offline-auth");
        channel.onmessage = (msg) => {
          if (msg.data?.type === "LOCK_WORKSPACE") {
            applyWorkspaceLock();
            clearAllAuthStorage();
            tenantPreferences.clearAll();
            dispatch(logout());
            if (window.location.pathname !== "/login") {
              window.location.replace(`${window.location.origin}/login`);
            }
          }
        };
      } catch {
        channel = null;
      }
    }

    window.addEventListener("suntech:lock", handleLocalLock);
    window.addEventListener("storage", handleStorageLock);
    return () => {
      disposed = true;
      channel?.close();
      window.removeEventListener("suntech:lock", handleLocalLock);
      window.removeEventListener("storage", handleStorageLock);
    };
  }, [dispatch]);

  const resumeOffline = useCallback(async (target: OfflineScope) => {
    const generation = offlineLockGeneration();
    const permission = await verifySavedPermission(offlineDb, target, "OFFLINE");
    assertOfflineLockGeneration(generation);
    setClaims(permission.claims);
    setMode("OFFLINE");
    setError(null);
  }, []);

  // Automatic restoration when server session verification is unavailable (offline / cold restart / expired routing cookie)
  useEffect(() => {
    if (!auth.sessionUnavailable || auth.user) return;
    let cancelled = false;

    const restoreWorkspace = async () => {
      try {
        const ws = await readTrustedWorkspace(offlineDb);
        if (cancelled) return;

        if (!ws || !ws.active || !ws.scope) {
          setClaims(null);
          setMode("LOCKED");
          setRestoreComplete(true);
          return;
        }

        const expectedDeviceId = await getDeviceId(offlineDb);
        if (cancelled) return;
        if (ws.scope.deviceId !== expectedDeviceId) {
          setClaims(null);
          setMode("LOCKED");
          setError("This device identity does not match the saved workspace.");
          setRestoreComplete(true);
          return;
        }

        try {
          const generation = offlineLockGeneration();
          const verified = await verifySavedPermission(offlineDb, ws.scope, "OFFLINE");
          assertOfflineLockGeneration(generation);
          const snapshot = await offlineDb.catalogSnapshots.get(scopeKey(ws.scope));
          if (!snapshot) {
            throw new OfflineError("CATALOG_NOT_READY", "Complete shop data is missing for offline use. Reconnect once to download it.");
          }
          if (cancelled) return;

          saveStoredUser(verified.record.user);
          if (verified.record.user.role === "ADMIN") {
            const branch = {
              id: ws.scope.locationId,
              businessId: ws.scope.businessId,
              name: snapshot.location.name,
              code: ws.scope.locationId.slice(0, 6).toUpperCase(),
              address: null,
              status: "ACTIVE" as const,
            };
            const business = {
              id: ws.scope.businessId,
              name: snapshot.business.name,
              code: ws.scope.businessId.slice(0, 6).toUpperCase(),
              status: "ACTIVE" as const,
              branches: [branch],
            };
            tenantPreferences.setTenantContext(verified.record.user.id, { business, branch });
            dispatch(setTenantSelection({ business, branch }));
          }
          dispatch(hydrateAuth({ user: verified.record.user }));
          setClaims(verified.claims);
          setMode("OFFLINE");
          setError(null);
          setRestoreComplete(true);

          const pathname = window.location.pathname;
          if (pathname === "/login" || pathname === "/") {
            const target = verified.record.user.role === "ADMIN" ? "/admin/terminal" : "/pos/terminal";
            window.history.replaceState({}, "", target);
            window.dispatchEvent(new PopStateEvent("popstate"));
          }
        } catch (cause) {
          if (cancelled) return;
          setClaims(null);
          setMode("LOCKED");
          setError(cause instanceof Error ? cause.message : "Offline permission cannot be verified.");
          // Keep saved records accessible for recovery if any sales exist for this expired/rejected permission
          const savedPermission = await offlineDb.permissions.get(scopeKey(ws.scope)).catch(() => undefined);
          const savedSalesCount = await offlineDb.localSales.where("scopeKey").equals(scopeKey(ws.scope)).count().catch(() => 0);
          if (savedPermission && savedSalesCount > 0) {
            setRecoveryProfile(savedPermission);
          }
          setRestoreComplete(true);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Unable to read local workspace storage.");
          setMode("LOCKED");
          setRestoreComplete(true);
        }
      }
    };

    void restoreWorkspace();
    return () => {
      cancelled = true;
    };
  }, [auth.sessionUnavailable, auth.user, dispatch]);

  const refresh = useCallback(async () => {
    if (!scope || auth.user?.role === "SUPER_ADMIN") return;
    const key = scopeKey(scope);
    if (inFlightRefresh.current && inFlightRefresh.current.key === key) {
      return inFlightRefresh.current.promise;
    }

    const generation = ++refreshGeneration.current;
    const isCurrent = () => generation === refreshGeneration.current && !!currentScope.current && scopeKey(currentScope.current) === key;
    const requestStartedAt = Date.now();

    const runProvision = async () => {
      const requestTimeout = navigator.onLine ? 12_000 : 1_500;
      const body = { deviceId: scope.deviceId, businessId: scope.businessId, locationId: scope.locationId };
      try {
        return await apiClient.post<ProvisioningResponse>("/offline/provision", body, { timeout: requestTimeout });
      } catch (firstCause) {
        if (firstCause instanceof ApiClientError && firstCause.code === "SESSION_RENEWED_RETRY_REQUIRED") {
          return await apiClient.post<ProvisioningResponse>("/offline/provision", body, { timeout: requestTimeout });
        }
        throw firstCause;
      }
    };

    const task = (async () => {
      try {
        const response = await runProvision();
        if (!isCurrent()) return;
        await installProvisioning(offlineDb, response.data, scope, { requestStartedAt, trustWorkspace: true });
        void navigator.storage?.persist?.().catch(() => undefined);
        if (!isCurrent()) return;
        const verified = await verifySavedPermission(offlineDb, scope, "ONLINE");
        if (!isCurrent()) return;
        setClaims(verified.claims);
        setMode("ONLINE");
        setError(null);
      } catch (cause) {
        if (!isCurrent()) return;

        if (cause instanceof ApiClientError && [401, 403].includes(cause.status) && cause.code !== "SESSION_RENEWED_RETRY_REQUIRED") {
          lockOffline(scope);
          setClaims(null);
          setMode("LOCKED");
          try {
            await markOfflinePermissionRejected(offlineDb, scope, cause.message || "The server rejected this operator's authorization.", requestStartedAt);
            if (!isCurrent()) return;
            setError(cause.code && CONFIG_PROVISION_CODES.has(cause.code) ? cause.message : "Sign in again to verify this operator. Saved sales have been kept.");
          } catch (storageCause) {
            if (!isCurrent()) return;
            setError(
              `New sales are locked. The server rejected authorization and local storage could not save that change: ${
                storageCause instanceof Error ? storageCause.message : String(storageCause)
              }.`,
            );
          }
          return;
        }

        if (!isNetworkOrOutageFailure(cause)) {
          // Preserve actionable backend/config provisioning errors (e.g. OFFLINE_SIGNING_INVALID, OFFLINE_POLICY_INVALID, 500/4xx)
          // instead of masking them behind a local lookup failure.
          setClaims(null);
          setMode("LOCKED");
          if (cause instanceof ApiClientError && cause.status === 404) {
            setError("Offline service is not deployed on the connected backend server (POST /offline/provision returned 404). Deploy the updated backend to enable offline checkout.");
          } else {
            setError(cause instanceof Error && cause.message ? cause.message : "Offline setup could not finish on the server.");
          }
          return;
        }

        // Genuine network / backend-unreachable outage: verify trusted local permission + complete catalog
        try {
          const permission = await verifySavedPermission(offlineDb, scope, "OFFLINE");
          const snapshot = await offlineDb.catalogSnapshots.get(key);
          if (!snapshot) {
            throw new OfflineError("CATALOG_NOT_READY", "Complete shop data is missing for offline use. Reconnect once to download it.");
          }
          if (!isCurrent()) return;
          setClaims(permission.claims);
          setMode("OFFLINE");
          setError(null);
        } catch (offlineCause) {
          if (!isCurrent()) return;
          setClaims(null);
          setMode("LOCKED");
          if (offlineCause instanceof OfflineError && offlineCause.code === "NOT_PROVISIONED") {
            setError("Server unreachable and this branch is not prepared for offline checkout yet. Connect to finish automatic setup.");
          } else {
            setError(offlineCause instanceof Error ? offlineCause.message : "Offline access is unavailable. Connect to the server to continue.");
          }
        }
      }
    })();

    inFlightRefresh.current = { key, promise: task };
    try {
      await task;
    } finally {
      if (inFlightRefresh.current?.promise === task) {
        inFlightRefresh.current = null;
      }
    }
  }, [scope, auth.user?.role]);

  const syncNow = useCallback(async () => {
    if (!scope || !navigator.onLine || mode !== "ONLINE" || !matchesScope) return;
    if (busy.current) return busy.current;
    const nowMs = Date.now();
    lastSyncAttempt.current = nowMs;

    const controller = new AbortController();
    syncing.current = controller;
    setIsSyncing(true);

    const task = (async () => {
      const targets = await listOperatorSyncScopes(offlineDb, scope);
      const seen = new Set<string>();
      let anySynced = false;
      let anyReview = false;
      const transport = async (command: AdvancedCommand) =>
        (await apiClient.post<unknown>("/offline/commands/v1", command, { timeout: 30_000, signal: controller.signal })).data;

      for (const original of targets) {
        if (controller.signal.aborted || !currentScope.current || scopeKey(currentScope.current) !== scopeKey(scope)) break;
        const key = scopeKey(original);
        if (seen.has(key)) continue;
        seen.add(key);

        const syncRes = await drainSync(
          offlineDb,
          original,
          async (envelope, signal) =>
            (await apiClient.post<{ results: SyncResult[] }>("/orders/sync-v2", envelope, { timeout: 30_000, signal })).data,
          { authenticatedUserId: scope.userId, resumeAuthenticated: true, signal: controller.signal },
        );
        const advanced = await drainAdvancedCommands(offlineDb, original, scope.userId, transport, { signal: controller.signal });
        if (syncRes.synced > 0 || advanced.synced > 0) anySynced = true;
        if (syncRes.review > 0 || advanced.review > 0) anyReview = true;
      }

      if (anySynced || anyReview) {
        await Promise.all(
          ["orders", "catalog", "admin-dashboard", "reports", "shifts"].map((queryKey) =>
            queryClient.invalidateQueries({ queryKey: [queryKey] }),
          ),
        );
      }
    })();

    busy.current = task;
    try {
      await task;
    } finally {
      if (busy.current === task) busy.current = null;
      if (syncing.current === controller) syncing.current = null;
      setIsSyncing(false);
    }
  }, [scope, mode, matchesScope, queryClient]);

  useEffect(() => {
    if (!scope) return;
    let active = true;
    // Start provisioning cleanly after scope render settles
    const initialRefresh = window.setTimeout(() => {
      if (active) void refresh();
    }, 0);

    const subscription = liveQuery(async () => {
      const key = scopeKey(scope);
      const [pending, review, advancedPending, snapshot] = await Promise.all([
        offlineDb.outbox.where("scopeKey").equals(key).filter((row) => row.state !== "SYNCED" && row.state !== "NEEDS_REVIEW").count(),
        offlineDb.outbox.where("scopeKey").equals(key).filter((row) => row.state === "NEEDS_REVIEW").count(),
        offlineDb.advancedCommands.where("scopeKey").equals(key).filter((row) => row.state !== "SYNCED" && row.state !== "NEEDS_REVIEW").count(),
        offlineDb.catalogSnapshots.get(key),
      ]);
      return { pending, review, advancedPending, snapshot: snapshot?.snapshotId };
    }).subscribe({
      next: (value) => {
        if (!active) return;
        setCounts({
          pending: value.pending,
          review: value.review,
          advancedPending: value.advancedPending,
          scopeKey: scopeKey(scope),
        });
        setRevision((prev) => prev + 1);
        void queryClient.invalidateQueries({ queryKey: ["offline"] });
      },
      error: (cause) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Local database cannot be read.");
          setMode("LOCKED");
        }
      },
    });

    const renewal = window.setInterval(() => {
      if (document.visibilityState !== "hidden") {
        void refresh();
      }
    }, 240_000);
    const reconnect = () => {
      void refresh();
    };
    window.addEventListener("online", reconnect);
    window.addEventListener("offline", reconnect);
    window.addEventListener("suntech:reconnect", reconnect);
    return () => {
      active = false;
      clearTimeout(initialRefresh);
      subscription.unsubscribe();
      clearInterval(renewal);
      window.removeEventListener("online", reconnect);
      window.removeEventListener("offline", reconnect);
      window.removeEventListener("suntech:reconnect", reconnect);
    };
  }, [scope, refresh, queryClient]);

  const scopedPending = scope && counts.scopeKey === scopeKey(scope) ? counts.pending : 0;
  const scopedReview = scope && counts.scopeKey === scopeKey(scope) ? counts.review : 0;
  const scopedAdvancedPending = scope && counts.scopeKey === scopeKey(scope) ? counts.advancedPending : 0;

  const hasPendingToSync = scopedPending > 0 || scopedAdvancedPending > 0;

  // Automatic drain when ONLINE (abort ONLY if leaving ONLINE mode or changing scope, never when pending count updates)
  useEffect(() => {
    if (mode !== "ONLINE") return;
    const sync = (forceWindowCheck = false) => {
      if (forceWindowCheck && Date.now() - lastSyncAttempt.current < 5_000) return;
      void syncNow().catch(() => {
        /* Retry state persisted in Dexie outbox before returning. */
      });
    };

    sync(false);
    const onFocus = () => sync(true);
    const onSyncEvent = () => sync(false);
    window.addEventListener("focus", onFocus);
    window.addEventListener("suntech:sync", onSyncEvent);
    return () => {
      syncing.current?.abort();
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("suntech:sync", onSyncEvent);
    };
  }, [mode, syncNow]);

  // Bounded periodic retry only while ONLINE and queued records remain
  useEffect(() => {
    if (mode !== "ONLINE" || !hasPendingToSync) return;
    const timer = setInterval(() => {
      void syncNow().catch(() => {
        /* Retry state persisted in Dexie outbox before returning. */
      });
    }, 10_000);
    return () => clearInterval(timer);
  }, [mode, hasPendingToSync, syncNow]);

  useEffect(() => {
    const navigateOffline = (event: MouseEvent) => {
      if (visibleMode !== "OFFLINE" && navigator.onLine) return;
      // Offline PWA shell already uses SPA navigation via pwa/navigation.tsx without server hops.
      if (document.getElementById("suntech-offline-root")) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const target = new URL(anchor.href, window.location.href);
      if (target.origin !== location.origin || (target.hash && target.pathname === location.pathname)) return;
      event.preventDefault();
      event.stopPropagation();
      void flushDrafts()
        .then(() => window.location.assign(target.href))
        .catch((cause) =>
          toast.error(cause instanceof Error ? cause.message : "Save the current cart before leaving this screen."),
        );
    };
    document.addEventListener("click", navigateOffline, true);
    return () => document.removeEventListener("click", navigateOffline, true);
  }, [visibleMode]);

  const value: OfflineContextValue = {
    scope,
    mode: visibleMode,
    ready: Boolean(scope && (visibleMode === "ONLINE" || visibleMode === "OFFLINE")),
    syncing: isSyncing,
    error,
    revision,
    pending: scopedPending,
    review: scopedReview,
    claims: matchesScope ? claims : null,
    refresh,
    syncNow,
    resumeOffline,
  };

  // When session is unavailable offline:
  // - If trusted workspace was automatically restored (auth.user hydrated), render children seamlessly!
  // - If expired/rejected with saved records, render read-only recovery access without leaking new-sale permission.
  // - If logged out / never prepared, render normal children (Login screen / status) cleanly.
  const waitingAutoRestore = auth.sessionUnavailable && !auth.user && !restoreComplete;

  return (
    <OfflineContext.Provider value={value}>
      {waitingAutoRestore ? (
        <div className="min-h-screen animate-pulse bg-slate-50" aria-busy="true" aria-label="Restoring workspace" />
      ) : recoveryProfile ? (
        <OfflineRecovery profile={recoveryProfile} onClose={() => setRecoveryProfile(null)} />
      ) : (
        children
      )}
      {auth.user && auth.user.role !== "SUPER_ADMIN" ? <OfflineStatus /> : null}
    </OfflineContext.Provider>
  );
}
