"use client";
import { useEffect, useState } from "react";
import { offlineDb } from "../db/offline-db";
import { readLocalHistory } from "../core/bootstrap";
import { exportEncryptedBackup } from "../core/backup";
import type { OfflinePermission } from "../core/types";
import type { Order } from "@/types/domain";
import { mapOrderToReceipt, type ReceiptViewModel } from "@/features/pos/view-models";
import { ReceiptDialog } from "@/features/pos/components/receipt-dialog";
import { formatBDT } from "@/lib/utils";

/** Valid local unlock can recover evidence even after new-sale authority expires. */
export function OfflineRecovery({ profile, onClose }: { profile: OfflinePermission; onClose: () => void }) {
  const [page, setPage] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<ReceiptViewModel | null>(null);
  useEffect(() => {
    let active = true;
    void readLocalHistory(offlineDb, profile.scope, { offset: page * 20, limit: 20 }).then(result => { if (active) { setOrders(result.orders); setTotal(result.total); } }).catch(cause => { if (active) setError(String(cause)); });
    return () => { active = false; };
  }, [profile.scope, page]);
  const backup = async () => {
    try {
      const content = await exportEncryptedBackup(offlineDb, profile.scope, password);
      const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `suntech-recovery-${Date.now()}.json`; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000); setPassword("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Backup could not be created."); }
  };
  return <section className="mx-auto max-w-3xl space-y-4 p-6">
    <h1 className="text-xl font-semibold">Saved records — recovery only</h1>
    <p>{profile.user.fullName} · {profile.user.locationName || profile.scope.locationId}</p>
    <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">You can read receipts and make an encrypted backup here. New sales and refunds are disabled. Connect and sign in as the original operator to sync. This is this device&apos;s saved history, not complete business reporting.</p>
    {orders.map(order => <div key={order.id} className="flex items-center justify-between gap-2 rounded border p-3 text-sm"><span>{order.invoiceNumber} · {formatBDT(order.totalAmount)}</span><button className="rounded border px-2 py-1" onClick={() => setReceipt(mapOrderToReceipt(order))}>View receipt</button></div>)}
    <div className="flex gap-3"><button disabled={page === 0} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {page + 1} of {Math.max(1, Math.ceil(total / 20))}</span><button disabled={(page + 1) * 20 >= total} onClick={() => setPage(value => value + 1)}>Next</button></div>
    <label className="grid gap-1 text-sm">Backup passphrase (at least 12 characters)<input type="password" className="rounded border p-2" value={password} onChange={event => setPassword(event.target.value)} /></label>
    <p className="text-sm">Copy the encrypted download to an approved separate device or storage location. Keep its passphrase separately.</p>
    <div className="flex gap-3"><button className="rounded bg-blue-700 p-2 text-white" onClick={() => void backup()}>Download encrypted backup</button><button className="rounded border p-2" onClick={onClose}>Back to unlock</button></div>
    {error ? <p role="alert" className="text-red-700">{error}</p> : null}
    <ReceiptDialog recoveryScope={profile.scope} receipt={receipt} open={!!receipt} onOpenChange={value => { if (!value) setReceipt(null); }} />
  </section>;
}
