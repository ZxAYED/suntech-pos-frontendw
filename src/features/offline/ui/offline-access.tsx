"use client";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { offlineDb } from "../db/offline-db";
import { listOfflineProfiles, unlockOffline, offlineLockGeneration, assertOfflineLockGeneration } from "../core/grant";
import type { OfflinePermission } from "../core/types";
import { hydrateAuth } from "@/redux/actions/authActions";
import { setTenantSelection } from "@/redux/actions/tenantActions";
import { tenantPreferences } from "@/lib/tenant-preferences";
import { useOffline } from "./offline-provider";
import { OfflineRecovery } from "./offline-recovery";

export function OfflineAccess({ compact = false }: { compact?: boolean }) {
  const [profiles, setProfiles] = useState<OfflinePermission[]>([]);
  const [chosen, setChosen] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState<OfflinePermission | null>(null);
  const dispatch = useDispatch();
  const router = useRouter();
  const offline = useOffline();
  useEffect(() => { let active = true; void listOfflineProfiles(offlineDb).then(items => { if (active) setProfiles(items); }).catch(cause => { if (active) setError(String(cause)); }); return () => { active = false; }; }, []);
  const unlock = async (recoveryOnly = false) => {
    const profile = profiles.find(item => item.scopeKey === chosen);
    if (!profile || busy) return;
    setBusy(true); setError("");
    try {
      const generation = offlineLockGeneration();
      const record = await unlockOffline(offlineDb, profile.scope, passphrase, { recoveryOnly });
      assertOfflineLockGeneration(generation);
      if (recoveryOnly) { setPassphrase(""); setRecovery(record); return; }
      const snapshot = await offlineDb.catalogSnapshots.get(profile.scopeKey);
      if (!snapshot) throw new Error("A complete catalog has not been saved. Reconnect to finish setup.");
      assertOfflineLockGeneration(generation);
      await offline.resumeOffline(profile.scope);
      assertOfflineLockGeneration(generation);
      dispatch(hydrateAuth({ user: record.user }));
      if (record.user.role === "ADMIN") {
        const branch = { id: profile.scope.locationId, businessId: profile.scope.businessId, name: snapshot.location.name, code: profile.scope.locationId.slice(0, 6), address: null, status: "ACTIVE" as const };
        const business = { id: profile.scope.businessId, name: snapshot.business.name, code: profile.scope.businessId.slice(0, 6), status: "ACTIVE" as const, branches: [branch] };
        dispatch(setTenantSelection({ business, branch }));
        tenantPreferences.setTenantContext(record.user.id, { business, branch });
      }
      setPassphrase("");
      router.replace(record.user.role === "ADMIN" ? "/admin/terminal" : "/pos/terminal");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to unlock this register."); }
    finally { setBusy(false); }
  };
  if (recovery) return <OfflineRecovery profile={recovery} onClose={() => setRecovery(null)} />;
  return <section className={compact ? "space-y-3" : "mx-auto grid min-h-screen max-w-lg place-content-center gap-4 p-6"}>
    <h1 className="text-xl font-semibold">Open saved register</h1>
    <p className="text-sm text-slate-600">Choose your prepared operator and branch, then enter your offline passphrase. This does not renew your server login. Saved sales stay on this device.</p>
    {!profiles.length ? <p>No prepared register was found. Connect to the server and sign in first.</p> : <>
      <label className="grid gap-1 text-sm">Operator and branch<select className="rounded border p-2" value={chosen} onChange={event => setChosen(event.target.value)}><option value="">Choose register</option>{profiles.map(profile => <option key={profile.scopeKey} value={profile.scopeKey}>{profile.user.fullName} · {profile.user.locationName || profile.scope.locationId}</option>)}</select></label>
      <label className="grid gap-1 text-sm">Offline passphrase<input type="password" autoComplete="off" className="rounded border p-2" value={passphrase} onChange={event => setPassphrase(event.target.value)} onKeyDown={event => { if (event.key === "Enter") void unlock(); }} /></label>
      <button type="button" className="rounded bg-blue-700 p-2 text-white disabled:opacity-50" disabled={!chosen || !passphrase || busy} onClick={() => void unlock()}>{busy ? "Checking permission…" : "Unlock saved register"}</button>
      <button type="button" className="rounded border p-2 disabled:opacity-50" disabled={!chosen || !passphrase || busy} onClick={() => void unlock(true)}>Open saved records only</button>
    </>}
    {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
    <button type="button" className="rounded border p-2 text-sm" onClick={() => window.location.assign(new URL("/login", window.location.origin).href)}>Reconnect and sign in online</button>
  </section>;
}
