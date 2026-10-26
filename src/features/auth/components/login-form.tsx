"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/common/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLoginMutation, type LoginPayload } from "@/redux/api/authApi";
import { setCredentials } from "@/redux/actions/authActions";
import type { UserRole } from "@/types/domain";

function destinationFor(role: UserRole) {
  if (role === "SUPER_ADMIN") return "/super-admin";
  if (role === "CASHIER") return "/pos/terminal";
  return "/admin/select-business";
}

export function LoginForm() {
  const router = useRouter();
  const dispatch = useDispatch();
  const login = useLoginMutation();
  const [activeTab, setActiveTab] = useState<"admin" | "cashier">("admin");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [cashierPublicId, setCashierPublicId] = useState("");
  const [cashierPassword, setCashierPassword] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload: LoginPayload = activeTab === "admin"
      ? { loginType: "ADMIN", email: adminEmail.trim(), password: adminPassword }
      : { loginType: "BUSINESS_USER", publicId: cashierPublicId.trim().toUpperCase(), password: cashierPassword };
    if ((activeTab === "admin" ? !adminEmail.trim() : !cashierPublicId.trim()) || payload.password.length < 8) {
      toast.error(`Enter ${activeTab === "admin" ? "an email" : "a Public ID"} and a password of at least 8 characters.`);
      return;
    }
    try {
      const session = await login.mutateAsync(payload);
      dispatch(setCredentials({ user: session.user }));
      router.replace(destinationFor(session.user.role));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.35, ease: "easeOut" }} className="w-full max-w-md">
      <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <CardHeader className="space-y-3 border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between"><BrandLogo size="md" href="/" /><span className="rounded border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">Secure sign in</span></div>
          <div><h1 className="text-xl font-bold tracking-tight text-[#070B28]">Sign in to SunTech POS</h1><p className="mt-0.5 text-xs text-slate-500">Use the credential type assigned to your account.</p></div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-md border border-slate-200 bg-slate-100/80 p-1">
            {(["admin", "cashier"] as const).map((tab) => { const active = activeTab === tab; const Icon = tab === "admin" ? ShieldCheck : UserCheck; return <button key={tab} type="button" disabled={login.isPending} onClick={() => setActiveTab(tab)} aria-pressed={active} className={`relative flex min-h-10 items-center justify-center gap-1.5 rounded-sm text-xs font-medium ${active ? "text-[#070B28]" : "text-slate-500 hover:text-[#070B28]"}`}>{active ? <motion.div layoutId="activeAuthTab" transition={{ type: "spring", stiffness: 450, damping: 30 }} className="absolute inset-0 rounded-sm bg-white shadow-xs" /> : null}<Icon className="relative z-10 h-3.5 w-3.5 text-[#0052FF]" aria-hidden="true" /><span className="relative z-10">{tab === "admin" ? "Admin" : "Cashier"}</span></button>; })}
          </div>
          <AnimatePresence mode="wait">
            {activeTab === "admin" ? (
              <motion.form key="admin" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} onSubmit={(event) => void submit(event)} className="space-y-4">
                <Field label="Email" id="admin-email"><Input id="admin-email" type="email" autoComplete="username" required disabled={login.isPending} value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} placeholder="admin@example.com" /></Field>
                <Field label="Password" id="admin-password" action={<Link href="/forgot-password" className="text-[11px] font-medium text-[#0052FF] hover:underline">Forgot?</Link>}><Input id="admin-password" type="password" autoComplete="current-password" minLength={8} required disabled={login.isPending} value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder="Enter password" /></Field>
                <SubmitButton loading={login.isPending}>Sign in as Admin</SubmitButton>
              </motion.form>
            ) : (
              <motion.form key="cashier" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} onSubmit={(event) => void submit(event)} className="space-y-4">
                <Field label="Public ID" id="cashier-id"><Input id="cashier-id" autoComplete="username" required disabled={login.isPending} value={cashierPublicId} onChange={(event) => setCashierPublicId(event.target.value.toUpperCase())} placeholder="CSH-K9M2P" className="uppercase font-mono" /></Field>
                <Field label="Password" id="cashier-password"><Input id="cashier-password" type="password" autoComplete="current-password" minLength={8} required disabled={login.isPending} value={cashierPassword} onChange={(event) => setCashierPassword(event.target.value)} placeholder="Enter password" /></Field>
                <SubmitButton loading={login.isPending}>Sign in as Cashier</SubmitButton>
              </motion.form>
            )}
          </AnimatePresence>
          <p className="mt-5 rounded-md border border-blue-100 bg-blue-50 p-2.5 text-[11px] text-blue-800">Credentials are sent through the same-origin SunTech gateway. Session tokens remain in HttpOnly cookies and are never stored in browser JavaScript storage.</p>
          <div className="mt-4 border-t border-slate-100 pt-3 text-center text-xs text-slate-500">Need a store account? <Link href="/register" className="font-medium text-[#0052FF] hover:underline">Register for approval</Link></div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Field({ label, id, action, children }: { label: string; id: string; action?: React.ReactNode; children: React.ReactNode }) { return <div className="space-y-1.5"><div className="flex items-center justify-between"><label htmlFor={id} className="text-xs font-medium text-[#070B28]">{label}</label>{action}</div>{children}</div>; }
function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) { return <Button type="submit" loading={loading} className="h-10 w-full bg-[#0052FF] text-xs font-medium text-white hover:bg-[#0047E0]">{children}<ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" /></Button>; }
