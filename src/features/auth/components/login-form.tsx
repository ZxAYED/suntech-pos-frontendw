"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, Mail, Hash } from "lucide-react";
import { toast } from "sonner";
import { AuthCard } from "./auth-card";
import { AuthHeader } from "./auth-header";
import { AuthModeSwitcher, type AuthMode } from "./auth-mode-switcher";
import { AuthFormField, PasswordInput } from "./auth-form-field";
import { AuthPrimaryButton } from "./auth-primary-button";
import { Input } from "@/components/ui/input";
import { useLoginMutation, type LoginPayload } from "@/redux/api/authApi";
import { setCredentials } from "@/redux/actions/authActions";
import { unifiedLoginSchema } from "@/lib/validations";
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
  const [activeTab, setActiveTab] = useState<AuthMode>("admin");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [cashierPublicId, setCashierPublicId] = useState("");
  const [cashierPassword, setCashierPassword] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload =
      activeTab === "admin"
        ? { loginType: "ADMIN" as const, email: adminEmail.trim(), password: adminPassword }
        : { loginType: "BUSINESS_USER" as const, publicId: cashierPublicId.trim().toUpperCase(), password: cashierPassword };

    const validation = unifiedLoginSchema.safeParse(payload);
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || "Invalid credentials format");
      return;
    }

    try {
      const session = await login.mutateAsync(validation.data as LoginPayload);
      dispatch(setCredentials({ user: session.user }));
      router.replace(destinationFor(session.user.role));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    }
  };

  return (
    <AuthCard>
      {/* Brand & Editorial Title Header */}
      <AuthHeader
        badge="Secure Portal"
        badgeVariant="blue"
        title={
          <>
            Welcome{" "}
            <span className="bg-gradient-to-r from-[#0052FF] via-[#1D63FF] to-[#38BDF8] bg-clip-text text-transparent">
              back
            </span>
          </>
        }
        subtitle="Sign in to manage your business and counter checkout operations."
      />

      {/* Main Form Body */}
      <div className="pt-6 space-y-6">
        {/* Navy Segmented Mode Selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500 block">
            Select Credential Type
          </label>
          <AuthModeSwitcher
            activeMode={activeTab}
            onChange={(mode) => setActiveTab(mode)}
            disabled={login.isPending}
          />
        </div>

        {/* Dynamic Mode Forms with Smooth Animation */}
        <AnimatePresence mode="wait">
          {activeTab === "admin" ? (
            <motion.form
              key="admin-form"
              id="panel-admin"
              role="tabpanel"
              aria-labelledby="tab-admin"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              onSubmit={(event) => void submit(event)}
              className="space-y-4"
            >
              <AuthFormField label="Admin Email" id="admin-email">
                <div className="relative">
                  <Input
                    id="admin-email"
                    type="email"
                    autoComplete="username"
                    required
                    disabled={login.isPending}
                    value={adminEmail}
                    onChange={(event) => setAdminEmail(event.target.value)}
                    placeholder="admin@example.com"
                    className="pl-10"
                  />
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                    aria-hidden="true"
                  />
                </div>
              </AuthFormField>

              <AuthFormField
                label="Password"
                id="admin-password"
                action={
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-[#0052FF] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </Link>
                }
              >
                <PasswordInput
                  id="admin-password"
                  autoComplete="current-password"
                  minLength={8}
                  required
                  disabled={login.isPending}
                  value={adminPassword}
                  onChange={(event) => setAdminPassword(event.target.value)}
                  placeholder="Enter your password"
                />
              </AuthFormField>

              <div className="pt-2">
                <AuthPrimaryButton loading={login.isPending} type="submit">
                  Sign in as Admin
                </AuthPrimaryButton>
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="cashier-form"
              id="panel-cashier"
              role="tabpanel"
              aria-labelledby="tab-cashier"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              onSubmit={(event) => void submit(event)}
              className="space-y-4"
            >
              <AuthFormField
                label="Terminal Public ID"
                id="cashier-id"
                helperText="Provided by your store administrator"
              >
                <div className="relative">
                  <Input
                    id="cashier-id"
                    autoComplete="username"
                    required
                    disabled={login.isPending}
                    value={cashierPublicId}
                    onChange={(event) => setCashierPublicId(event.target.value.toUpperCase())}
                    placeholder="CSH-K9M2P"
                    className="pl-10 font-mono uppercase tracking-wider text-sm"
                  />
                  <Hash
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                    aria-hidden="true"
                  />
                </div>
              </AuthFormField>

              <AuthFormField label="Password" id="cashier-password">
                <PasswordInput
                  id="cashier-password"
                  autoComplete="current-password"
                  minLength={8}
                  required
                  disabled={login.isPending}
                  value={cashierPassword}
                  onChange={(event) => setCashierPassword(event.target.value)}
                  placeholder="Enter your password"
                />
              </AuthFormField>

              <div className="pt-2">
                <AuthPrimaryButton loading={login.isPending} type="submit">
                  Sign in as Cashier
                </AuthPrimaryButton>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Footer Navigation & Trust */}
        <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-3 text-center text-xs">
          <p className="text-[#58647A]">
            Need a store account?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#0052FF] hover:underline cursor-pointer"
            >
              Register for approval
            </Link>
          </p>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Encrypted Session Authentication</span>
          </div>
        </div>
      </div>
    </AuthCard>
  );
}
