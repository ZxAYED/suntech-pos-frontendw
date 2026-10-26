"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/common/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRegisterMutation } from "@/redux/api/authApi";

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegisterMutation();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/.test(password)) {
      toast.error("Password must include uppercase, lowercase, number, and special character.");
      return;
    }
    try {
      await register.mutateAsync({ fullName: fullName.trim(), email: email.trim(), password, phoneNumber: phoneNumber.trim() || undefined });
      toast.success("Registration submitted for approval.");
      router.replace("/login");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Registration failed"); }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-6 selection:bg-[#0052FF] selection:text-white">
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.35, ease: "easeOut" }} className="w-full max-w-lg">
        <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
          <CardHeader className="space-y-3 border-b border-slate-100 pb-4"><div className="flex items-center justify-between"><BrandLogo size="md" href="/" /><span className="rounded border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#0052FF]">Store Admin</span></div><div><h1 className="text-xl font-bold tracking-tight text-[#070B28]">Register your account</h1><p className="mt-0.5 text-xs text-slate-500">Submit a store administrator profile for platform approval.</p></div></CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Full name" id="owner-name"><Input id="owner-name" required maxLength={120} value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Ahmed Khan" /></Field>
              <div className="grid gap-3 sm:grid-cols-2"><Field label="Business email" id="reg-email"><Input id="reg-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="owner@example.com" /></Field><Field label="Phone (optional)" id="reg-phone"><Input id="reg-phone" autoComplete="tel" minLength={8} maxLength={20} value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="+8801712345678" /></Field></div>
              <Field label="Password" id="reg-password"><Input id="reg-password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 strong characters" /></Field>
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3"><div className="flex items-center gap-1.5 text-xs font-medium text-amber-900"><CheckCircle2 className="h-3.5 w-3.5" />Approval required</div><p className="mt-1 text-[11px] text-amber-800">Registration creates a pending Admin account. A Super Admin must approve it before sign-in.</p></div>
              <Button type="submit" loading={register.isPending} className="h-10 w-full bg-[#0052FF] text-xs font-medium text-white hover:bg-[#0047E0]">Submit registration<ArrowRight className="ml-1 h-4 w-4" /></Button>
            </form>
            <div className="mt-4 border-t border-slate-100 pt-3 text-center text-xs text-slate-500">Already registered? <Link href="/login" className="font-medium text-[#0052FF] hover:underline">Sign in</Link></div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) { return <div className="space-y-1.5"><label htmlFor={id} className="text-xs font-medium text-[#070B28]">{label}</label>{children}</div>; }
