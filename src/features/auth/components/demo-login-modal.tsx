"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { ArrowRight, Loader2, ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLoginMutation, type LoginPayload } from "@/features/auth/api/use-auth";
import { saveStoredUser } from "@/lib/auth-storage";
import { setCredentials } from "@/redux/actions/authActions";
import type { UserRole } from "@/types/domain";

export const DEMO_CREDENTIALS = {
  admin: {
    email: "zayed@yzcalo.com",
    password: "12345678",
    title: "Store Administrator",
  },
  cashier: {
    publicId: "CSH-10003",
    password: "12345678",
    title: "Counter Cashier",
  },
} as const;

export function destinationForRole(role: UserRole): string {
  if (role === "SUPER_ADMIN") return "/super-admin";
  if (role === "CASHIER") return "/pos/terminal";
  return "/admin/select-business";
}

interface DemoLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoLoginModal({
  open,
  onOpenChange,
}: DemoLoginModalProps) {
  const [loadingRole, setLoadingRole] = useState<"ADMIN" | "CASHIER" | null>(null);

  const router = useRouter();
  const dispatch = useDispatch();
  const login = useLoginMutation();

  const handleAutoLogin = async (role: "ADMIN" | "CASHIER") => {
    if (loadingRole) return;
    setLoadingRole(role);

    const payload: LoginPayload =
      role === "ADMIN"
        ? {
            loginType: "ADMIN",
            email: DEMO_CREDENTIALS.admin.email,
            password: DEMO_CREDENTIALS.admin.password,
          }
        : {
            loginType: "BUSINESS_USER",
            publicId: DEMO_CREDENTIALS.cashier.publicId,
            password: DEMO_CREDENTIALS.cashier.password,
          };

    // Note: We do NOT populate the underlying input fields
    // so users retain their clean forms.

    try {
      const session = await login.mutateAsync(payload);
      saveStoredUser(session.user);
      dispatch(setCredentials({ user: session.user }));

      toast.success(
        `Signed in as ${session.user.fullName || (role === "ADMIN" ? "Admin" : "Cashier")}.`,
      );

      onOpenChange(false);

      const targetDestination = destinationForRole(session.user.role);
      router.replace(targetDestination);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Sign in failed. The backend service may still be waking up. Please try again.";
      toast.error(message);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-6 rounded-2xl border-slate-200/90 shadow-2xl bg-white">
        <DialogHeader className="space-y-1.5 text-left mb-5">
          <DialogTitle className="text-xl font-bold tracking-tight text-[#0A1138]">
            Demo Login
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Select an authorized account to enter the workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Admin Action Button */}
          <Button
            type="button"
            variant="default"
            disabled={loadingRole !== null}
            onClick={() => void handleAutoLogin("ADMIN")}
            whileHover={loadingRole !== null ? undefined : { scale: 1.01 }}
            whileTap={loadingRole !== null ? undefined : { scale: 0.98 }}
            className="w-full h-auto py-3 px-4 rounded-xl flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-white shrink-0">
                {loadingRole === "ADMIN" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {DEMO_CREDENTIALS.admin.title}
                </div>
                <div className="text-xs font-mono text-white/80">
                  {DEMO_CREDENTIALS.admin.email}
                </div>
              </div>
            </div>
            {loadingRole === "ADMIN" ? (
              <span className="text-xs font-medium text-white/85 shrink-0">
                Entering...
              </span>
            ) : (
              <ArrowRight className="h-4 w-4 shrink-0 text-white/80" />
            )}
          </Button>

          {/* Cashier Action Button */}
          <Button
            type="button"
            variant="navy"
            disabled={loadingRole !== null}
            onClick={() => void handleAutoLogin("CASHIER")}
            whileHover={loadingRole !== null ? undefined : { scale: 1.01 }}
            whileTap={loadingRole !== null ? undefined : { scale: 0.98 }}
            className="w-full h-auto py-3 px-4 rounded-xl flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-white shrink-0">
                {loadingRole === "CASHIER" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <UserCheck className="h-5 w-5" />
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {DEMO_CREDENTIALS.cashier.title}
                </div>
                <div className="text-xs font-mono text-white/80">
                  {DEMO_CREDENTIALS.cashier.publicId}
                </div>
              </div>
            </div>
            {loadingRole === "CASHIER" ? (
              <span className="text-xs font-medium text-white/85 shrink-0">
                Entering...
              </span>
            ) : (
              <ArrowRight className="h-4 w-4 shrink-0 text-white/80" />
            )}
          </Button>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          Default password: <span className="font-mono font-medium text-slate-600">12345678</span>
        </p>
      </DialogContent>
    </Dialog>
  );
}
