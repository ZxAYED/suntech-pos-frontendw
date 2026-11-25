"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { liveQuery } from "dexie";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Download, Loader2, RefreshCw, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOffline } from "./offline-provider";
import { offlineDb, type OfflineDatabase } from "../db/offline-db";
import {
  assertOfflineLockGeneration,
  installProvisioning,
  markOfflinePermissionRejected,
  offlineLockGeneration,
  setLocalUnlock,
} from "../core/grant";
import { OfflineError, scopeKey } from "../core/scope";
import { exportEncryptedBackup, listRecoveredScopes, restoreEncryptedBackup } from "../core/backup";
import { drainAdvancedCommands, type AdvancedRecord } from "../core/advanced-commands";
import { commandEntity } from "../core/advanced-wire";
import type { LegacyRefundEvidence } from "../services/refund-recovery";
import { drainSync, getSyncSummary, listOutboxPage } from "../core/sync";
import { readSaleReceipt } from "../core/checkout";
import { apiClient } from "@/lib/api-client";
import type { OfflineScope, OutboxRecord, OutboxState, ProvisioningResponse, SyncResult } from "../core/types";
import type { RootState } from "@/redux/types";
import { mapOrderToReceipt, type ReceiptViewModel } from "@/features/pos/view-models";
import { ReceiptDialog } from "@/features/pos/components/receipt-dialog";

interface SavedRegisterStatus {
  scope: OfflineScope;
  key: string;
  businessName: string;
  locationName: string;
  counts: Awaited<ReturnType<typeof getSyncSummary>>;
  advancedPending: number;
  advancedReview: number;
  legacyRefundReview: number;
  lastExport?: string;
}

const WAITING_STATES: OutboxState[] = ["NEEDS_REVIEW", "BLOCKED_AUTH", "UNKNOWN", "RETRY_WAIT", "PENDING", "SENDING"];

/** Enumerate the current register and recovered ORIGINAL device scopes for this operator only. */
export async function readSavedRegisterStatuses(
  db: OfflineDatabase,
  userId: string,
  current: OfflineScope | null,
): Promise<SavedRegisterStatus[]> {
  const unique = new Map<string, OfflineScope>();
  if (current?.userId === userId) unique.set(scopeKey(current), current);
  for (const prepared of await db.permissions.filter((row) => row.scope.userId === userId).toArray()) {
    unique.set(scopeKey(prepared.scope), prepared.scope);
  }
  for (const recovered of await listRecoveredScopes(db, userId)) {
    unique.set(scopeKey(recovered), recovered);
  }
  const legacyRefunds = await db.metadata
    .where("key")
    .startsWith("legacy-refund:")
    .filter((row) => {
      const evidence = row.value as LegacyRefundEvidence;
      return evidence?.scope?.userId === userId && evidence.state !== "RESOLVED";
    })
    .toArray();

  return Promise.all(
    [...unique].map(async ([key, scope]) => {
      const [counts, snapshot, advancedPending, advancedReview, backup] = await Promise.all([
        getSyncSummary(db, scope),
        db.catalogSnapshots.get(key),
        db.advancedCommands
          .where("scopeKey")
          .equals(key)
          .filter((row) => !["SYNCED", "NEEDS_REVIEW"].includes(row.state))
          .count(),
        db.advancedCommands
          .where("scopeKey")
          .equals(key)
          .filter((row) => row.state === "NEEDS_REVIEW")
          .count(),
        db.metadata.get(`backup-created:${key}`),
      ]);
      return {
        scope,
        key,
        counts,
        advancedPending,
        advancedReview,
        legacyRefundReview: legacyRefunds.filter((row) => scopeKey((row.value as LegacyRefundEvidence).scope) === key).length,
        lastExport: typeof backup?.value === "string" ? backup.value : undefined,
        businessName: snapshot?.business.name || scope.businessId,
        locationName: snapshot?.location.name || scope.locationId,
      };
    }),
  );
}

/** Page by indexed state/range, including original-device queues without reading every saved sale. */
export async function readWaitingRegisterPage(
  db: OfflineDatabase,
  status: SavedRegisterStatus,
  page: number,
  limit = 20,
): Promise<OutboxRecord[]> {
  let skip = Math.max(0, page) * limit;
  const rows: OutboxRecord[] = [];
  for (const state of WAITING_STATES) {
    const count = status.counts.counts[state];
    if (skip >= count) {
      skip -= count;
      continue;
    }
    rows.push(...(await listOutboxPage(db, status.scope, state, skip, limit - rows.length)));
    skip = 0;
    if (rows.length >= limit) break;
  }
  return rows;
}

/** Changing a local unlock requires a fresh verified server provisioning response, never an outage fallback. */
export async function prepareOfflinePassphrase(
  db: OfflineDatabase,
  scope: OfflineScope,
  passphrase: string,
  provision: (body: { deviceId: string; businessId: string; locationId: string }) => Promise<ProvisioningResponse>,
): Promise<void> {
  const requestStartedAt = Date.now();
  const generation = offlineLockGeneration();
  let response: ProvisioningResponse;
  try {
    response = await provision({ deviceId: scope.deviceId, businessId: scope.businessId, locationId: scope.locationId });
  } catch (cause) {
    const error = cause as { status?: number; code?: string } | undefined;
    if ((error?.status === 401 || error?.status === 403) && error?.code !== "SESSION_RENEWED_RETRY_REQUIRED") {
      await markOfflinePermissionRejected(db, scope, "The server rejected offline passphrase setup.", requestStartedAt);
    }
    throw cause;
  }
  assertOfflineLockGeneration(generation);
  const installed = await installProvisioning(db, response, scope, { requestStartedAt });
  if (installed.grantToken !== response.grantToken) {
    throw new OfflineError("PROVISIONING_SUPERSEDED", "A newer register permission arrived. Try again.");
  }
  await setLocalUnlock(db, scope, passphrase, generation);
}

/**
 * Minimal, non-intrusive navbar status indicator tailored for everyday store operations.
 * Normal states: Online, Offline, Syncing, Offline · N pending, Needs attention.
 */
export function OfflineConnectionIndicator() {
  const offline = useOffline();
  const user = useSelector((state: RootState) => state.auth.user);
  const [attentionOpen, setAttentionOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);

  if (!user || user.role === "SUPER_ADMIN") return null;

  const helpPath = user.role === "ADMIN" ? "/admin/help#offline-maintenance" : "/pos/help#offline-maintenance";
  const needsAttention = offline.review > 0 || (offline.mode === "LOCKED" && Boolean(offline.error)) || Boolean(offline.error);

  let label = "Online";
  let dotClass = "bg-emerald-500";
  let pillClass = "border-slate-200 bg-slate-50 text-slate-700";

  if (offline.syncing) {
    label = offline.pending > 0 ? `Syncing · ${offline.pending}` : "Syncing";
    dotClass = "bg-[#0052FF]";
    pillClass = "border-blue-200 bg-blue-50/70 text-[#0052FF]";
  } else if (needsAttention) {
    label = "Needs attention";
    dotClass = "bg-rose-500";
    pillClass = "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100/70 cursor-pointer";
  } else if (offline.mode === "OFFLINE") {
    label = offline.pending > 0 ? `Offline · ${offline.pending} pending` : "Offline";
    dotClass = "bg-amber-500";
    pillClass = "border-amber-200 bg-amber-50 text-amber-800";
  } else if (offline.mode === "ONLINE") {
    label = offline.pending > 0 ? `Online · ${offline.pending} pending` : "Online";
    dotClass = "bg-emerald-500";
    pillClass = "border-slate-200 bg-slate-50 text-slate-700";
  } else {
    label = "Connecting";
    dotClass = "bg-slate-400 animate-pulse";
    pillClass = "border-slate-200 bg-slate-50 text-slate-500";
  }

  const handleRetry = async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      await offline.refresh();
      if (offline.mode === "ONLINE") {
        await offline.syncNow();
      }
      setAttentionOpen(false);
    } catch {
      // Error surfaced via offline.error
    } finally {
      setRetrying(false);
    }
  };

  const pillContent = (
    <>
      {offline.syncing ? (
        <Loader2 className="h-3 w-3 animate-spin text-[#0052FF] shrink-0" aria-hidden="true" />
      ) : (
        <span className={`h-2 w-2 rounded-full shrink-0 ${dotClass}`} aria-hidden="true" />
      )}
      <span className="font-medium">{label}</span>
    </>
  );

  return (
    <>
      {needsAttention ? (
        <button
          type="button"
          onClick={() => setAttentionOpen(true)}
          aria-label="Connection status: Needs attention"
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs sm:text-sm whitespace-nowrap transition-colors ${pillClass}`}
        >
          {pillContent}
        </button>
      ) : (
        <div
          aria-label={`Connection status: ${label}`}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs sm:text-sm whitespace-nowrap ${pillClass}`}
        >
          {pillContent}
        </div>
      )}

      <Dialog open={attentionOpen} onOpenChange={setAttentionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              Connection &amp; Register Status
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-slate-700">
            {offline.error ? (
              <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                {offline.error}
              </p>
            ) : null}
            {offline.review > 0 ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800">
                {offline.review} saved sale(s) could not finish automatic sync and need review. Saved data on this device is intact.
              </p>
            ) : null}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <Link
                href={helpPath}
                onClick={() => setAttentionOpen(false)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Open Recovery in Help
              </Link>
              <button
                type="button"
                disabled={retrying}
                onClick={() => void handleRetry()}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#0052FF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0047E0] disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} />
                {retrying ? "Retrying…" : "Retry"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Maintenance, diagnostics, encrypted backup/restore & review controls.
 * Placed inside Admin & Cashier Help pages so daily POS screens remain uncluttered.
 */
export function OfflineMaintenancePanel({ role }: { role: "admin" | "cashier" }) {
  const offline = useOffline();
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const queryClient = useQueryClient();

  const [backupPassphrase, setBackupPassphrase] = useState("");
  const [storage, setStorage] = useState("");
  const [swReady, setSwReady] = useState<boolean | null>(null);
  const [loaded, setLoaded] = useState<{ userId: string; registers: SavedRegisterStatus[] }>({ userId: "", registers: [] });
  const [chosen, setChosen] = useState("");
  const [page, setPage] = useState(0);
  const [loadedRows, setLoadedRows] = useState<{ key: string; page: number; rows: OutboxRecord[] }>({ key: "", page: 0, rows: [] });
  const [advancedRows, setAdvancedRows] = useState<{ key: string; rows: AdvancedRecord[] }>({ key: "", rows: [] });
  const [advancedPage, setAdvancedPage] = useState(0);
  const [readError, setReadError] = useState("");
  const [working, setWorking] = useState(false);
  const [receiptState, setReceiptState] = useState<{ userId: string; scope: OfflineScope; value: ReceiptViewModel } | null>(null);
  const running = useRef(false);

  const receipt = receiptState && receiptState.userId === userId ? receiptState.value : null;
  const setReceipt = (value: ReceiptViewModel | null, originalScope?: OfflineScope) =>
    setReceiptState(value && userId && originalScope ? { userId, scope: originalScope, value } : null);

  const registers = loaded.userId === userId ? loaded.registers : [];
  const selected = registers.find((item) => item.key === chosen) || registers[0];
  const selectedKey = selected?.key;
  const totals = registers.reduce(
    (sum, item) => ({ pending: sum.pending + item.counts.pending, review: sum.review + item.counts.review }),
    { pending: 0, review: 0 },
  );
  const advancedWaiting = selected ? selected.advancedPending + selected.advancedReview : 0;
  const waiting = selected ? selected.counts.pending + selected.counts.review : 0;
  const pages = Math.max(1, Math.ceil(waiting / 20));
  const effectivePage = Math.min(page, pages - 1);
  const rows = loadedRows.key === selectedKey && loadedRows.page === effectivePage ? loadedRows.rows : [];

  useEffect(() => {
    if (!userId) return;
    let active = true;
    const subscription = liveQuery(() => readSavedRegisterStatuses(offlineDb, userId, offline.scope)).subscribe({
      next: (result) => {
        if (active) {
          setLoaded({ userId, registers: result });
          setReadError("");
        }
      },
      error: (cause) => {
        if (active) setReadError(cause instanceof Error ? cause.message : "Saved register information cannot be read.");
      },
    });
    const updateSwReady = () => {
      if (active && "serviceWorker" in navigator) {
        setSwReady(Boolean(navigator.serviceWorker.controller));
      }
    };
    if ("serviceWorker" in navigator) {
      void Promise.resolve().then(updateSwReady);
      void navigator.serviceWorker.ready.then(updateSwReady).catch(() => undefined);
      navigator.serviceWorker.addEventListener("controllerchange", updateSwReady);
    }
    if (navigator.storage?.estimate) {
      void navigator.storage
        .estimate()
        .then((info) => {
          if (active) {
            setStorage(`${Math.round((info.usage || 0) / 1024 / 1024)} MB used of about ${Math.round((info.quota || 0) / 1024 / 1024)} MB`);
          }
        })
        .catch(() => undefined);
    }
    return () => {
      active = false;
      subscription.unsubscribe();
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("controllerchange", updateSwReady);
      }
    };
  }, [userId, offline.scope]);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    void readWaitingRegisterPage(offlineDb, selected, effectivePage)
      .then((items) => {
        if (active) setLoadedRows({ key: selected.key, page: effectivePage, rows: items });
      })
      .catch((cause) => {
        if (active) setReadError(cause instanceof Error ? cause.message : "Saved records cannot be read.");
      });
    return () => {
      active = false;
    };
  }, [selected, effectivePage]);

  useEffect(() => {
    if (!selectedKey) return;
    const subscription = liveQuery(() =>
      offlineDb.advancedCommands
        .where("scopeKey")
        .equals(selectedKey)
        .filter((row) => row.state !== "SYNCED")
        .offset(advancedPage * 20)
        .limit(20)
        .toArray(),
    ).subscribe({
      next: (nextRows) => setAdvancedRows({ key: selectedKey, rows: nextRows }),
      error: (cause) => setReadError(cause instanceof Error ? cause.message : "Saved command records cannot be read."),
    });
    return () => subscription.unsubscribe();
  }, [selectedKey, advancedPage]);

  const run = async (fn: () => Promise<void>) => {
    if (running.current) return;
    running.current = true;
    setWorking(true);
    try {
      await fn();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "The action did not finish. Saved evidence has been kept.");
    } finally {
      running.current = false;
      setWorking(false);
    }
  };

  const syncOriginalScope = async (scope: OfflineScope) => {
    if (!userId || scope.userId !== userId || offline.mode !== "ONLINE") {
      throw new Error("Connect and sign in as the original operator before syncing saved records.");
    }
    const result = await drainSync(
      offlineDb,
      scope,
      async (envelope) =>
        (await apiClient.post<{ results: SyncResult[] }>("/orders/sync-v2", envelope, { timeout: 30_000 })).data,
      { authenticatedUserId: userId, resumeAuthenticated: true, force: true },
    );
    const advanced = await drainAdvancedCommands(
      offlineDb,
      scope,
      userId,
      async (command) => (await apiClient.post<unknown>("/offline/commands/v1", command, { timeout: 30_000 })).data,
    );
    if (advanced.synced || advanced.review || advanced.retry) {
      toast.info(`${advanced.synced} additional commands confirmed; ${advanced.review} review; ${advanced.retry} waiting.`);
    }
    await Promise.all(["orders", "catalog", "admin-dashboard", "reports", "shifts"].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
    if (result.blocked) toast.error("The server could not authorize this register. Saved sales remain available for recovery.");
    else if (result.leaseBusy) toast.info("Another tab is already checking this register's saved sales.");
    else if (result.review) toast.info(`${result.synced} confirmed; ${result.review} need review. Keep original payment evidence.`);
    else if (result.retry) toast.info(`${result.synced} confirmed. Remaining saved sales will retry automatically.`);
    else toast.success(`${result.synced} saved sales confirmed.`);
  };

  const download = async () => {
    if (!selected) return;
    const original = selected.scope;
    const backup = await exportEncryptedBackup(offlineDb, original, backupPassphrase);
    const url = URL.createObjectURL(new Blob([backup], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `suntech-backup-${original.businessId.slice(0, 8)}-${new Date().toISOString().replaceAll(":", "-")}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setBackupPassphrase("");
    toast.success("Encrypted backup downloaded. Store the file and passphrase separately.");
  };

  const viewReceipt = async (row: OutboxRecord) => {
    if (!selected) return;
    const saved = await readSaleReceipt(offlineDb, selected.scope, row.clientOrderId);
    if (!saved) throw new Error("The saved receipt needs recovery. Do not collect payment again.");
    setReceipt(
      mapOrderToReceipt({
        ...(saved.mapping?.order || saved.receipt.order),
        clientOrderId: row.clientOrderId,
        localStatus: saved.mapping ? "SYNCED" : row.state === "NEEDS_REVIEW" ? "NEEDS_REVIEW" : "PENDING",
      }),
      selected.scope,
    );
  };

  if (!userId) return null;

  return (
    <section
      id="offline-maintenance"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5 font-sans"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#0052FF]" />
            <h2 className="text-lg font-bold text-[#070B28]">
              {role === "admin" ? "Offline Maintenance, Backup & Recovery" : "Offline Diagnostics & Receipt Recovery"}
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            {totals.pending} pending upload · {totals.review} needing review
            {swReady !== null ? ` · Offline shell ${swReady ? "active" : "standby (reload if needed)"}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={working}
            onClick={() => void run(offline.refresh)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Verify Connection
          </button>
          <button
            type="button"
            disabled={working || offline.mode !== "ONLINE" || !selected}
            onClick={() => {
              if (selected) void run(() => syncOriginalScope(selected.scope));
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0052FF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0047E0] disabled:opacity-50 cursor-pointer"
          >
            Retry Sync
          </button>
        </div>
      </div>

      {offline.error ? (
        <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          {offline.error}
        </p>
      ) : null}
      {readError ? (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          {readError}
        </p>
      ) : null}

      {registers.length > 1 ? (
        <label className="grid gap-1 text-xs font-medium text-slate-700">
          Saved branch records
          <select
            aria-label="Saved register"
            className="rounded-lg border border-slate-200 bg-white p-2 text-sm"
            value={selectedKey || ""}
            onChange={(event) => {
              setChosen(event.target.value);
              setPage(0);
              setAdvancedPage(0);
              setReceipt(null);
            }}
          >
            {registers.map((item) => (
              <option key={item.key} value={item.key}>
                {item.businessName} · {item.locationName} ({item.counts.pending} pending / {item.counts.review} review)
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {offline.claims ? (
        <p className="text-xs text-slate-600">
          Offline selling permission:{" "}
          <strong className="text-[#070B28]">
            {offline.claims.offlineIntakeAllowed
              ? `Valid until ${new Date(offline.claims.exp * 1000).toLocaleDateString()}`
              : "Disabled by server policy"}
          </strong>
          {storage ? ` · Device storage: ${storage}` : ""}
        </p>
      ) : null}

      {selected && selected.legacyRefundReview > 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          {selected.legacyRefundReview} refund record(s) need reconciliation in Orders History before creating a repeat payout.
        </p>
      ) : null}

      {selected && advancedWaiting > 0 ? (
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold text-[#070B28]">Additional Saved Commands ({advancedWaiting})</h3>
          {(advancedRows.key === selectedKey ? advancedRows.rows : []).map((row) => (
            <div key={row.clientCommandId} className="rounded-lg border border-slate-200 p-2.5 text-xs space-y-1">
              <div className="font-semibold text-slate-800">
                {row.command.kind.replaceAll("_", " ")} — {row.state.replaceAll("_", " ")}
              </div>
              <p className="text-slate-600">
                Target {commandEntity(row.command)} · {new Date(row.command.occurredAt).toLocaleString()}
              </p>
              {row.lastMessage ? <p className="text-amber-800">{row.lastMessage}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      {selected ? (
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold text-[#070B28]">Saved Sales Awaiting Confirmation</h3>
          {rows.length > 0 ? (
            <div className="space-y-2">
              {rows.map((row) => (
                <div key={row.clientOrderId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-2.5 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-medium text-slate-800">{row.state.replaceAll("_", " ")}</div>
                    {row.lastMessage ? <p className="text-amber-800">{row.lastMessage}</p> : null}
                  </div>
                  <button
                    type="button"
                    disabled={working}
                    onClick={() => void run(() => viewReceipt(row))}
                    className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    View saved receipt
                  </button>
                </div>
              ))}
              {waiting > 20 ? (
                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <button
                    type="button"
                    disabled={!effectivePage || working}
                    onClick={() => setPage(effectivePage - 1)}
                    className="rounded border px-2 py-1 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span>
                    Page {effectivePage + 1} of {pages}
                  </span>
                  <button
                    type="button"
                    disabled={effectivePage + 1 >= pages || working}
                    onClick={() => setPage(effectivePage + 1)}
                    className="rounded border px-2 py-1 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              All saved sales for this branch are confirmed ({selected.counts.synced} synced).
            </p>
          )}
        </div>
      ) : null}

      <div className="space-y-3 border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-[#070B28]">Encrypted Device Backup &amp; Restore</h3>
        <p className="text-xs text-slate-500">
          Export saved records before clearing browser data or changing hardware. Passphrases require at least 12 characters.
          {selected?.lastExport ? ` Last export: ${new Date(selected.lastExport).toLocaleString()}.` : ""}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            aria-label="Backup passphrase"
            type="password"
            name="suntech_backup_key"
            autoComplete="new-password"
            data-lpignore="true"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs"
            value={backupPassphrase}
            onChange={(event) => setBackupPassphrase(event.target.value)}
            placeholder="Backup passphrase (min 12 characters)"
          />
          <button
            type="button"
            disabled={working || !selected || backupPassphrase.length < 12}
            onClick={() => void run(download)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Download Backup
          </button>
          <label className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
            <Upload className="h-3.5 w-3.5" />
            Restore Backup
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              disabled={working || !backupPassphrase}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const originalUser = userId;
                void run(async () => {
                  const restored = await restoreEncryptedBackup(offlineDb, await file.text(), backupPassphrase, originalUser);
                  setChosen(scopeKey(restored.scope));
                  setPage(0);
                  setBackupPassphrase("");
                  toast.success(`${restored.imported} event(s) restored; ${restored.alreadyPresent} already present.`);
                  if (offline.mode === "ONLINE") await syncOriginalScope(restored.scope);
                });
                event.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      <ReceiptDialog
        receipt={receipt}
        recoveryScope={receiptState?.userId === userId ? receiptState?.scope : undefined}
        open={Boolean(receipt)}
        onOpenChange={(value) => {
          if (!value) setReceipt(null);
        }}
      />
    </section>
  );
}

/**
 * Legacy mount inside OfflineProvider kept empty for normal operation so checkout UI
 * stays completely clean; connection state is displayed in Navbar via OfflineConnectionIndicator.
 */
export function OfflineStatus() {
  return null;
}
