"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Mail, KeyRound, CheckCircle2, ArrowLeft } from "lucide-react";
import {
  AuthShell,
  AuthCard,
  AuthHeader,
  AuthFormField,
  PasswordInput,
  AuthPrimaryButton,
  AuthNotice,
} from "@/features/auth/components";
import { Input } from "@/components/ui/input";
import { useResetPasswordMutation, useVerifyOtpMutation } from "@/redux/api/authApi";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  otp: z.string().regex(/^\d{6}$/, "Enter the six-digit numeric code"),
  newPassword: z
    .string()
    .min(8, "Minimum 8 characters")
    .max(72)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
      "Use uppercase, lowercase, number, and special character"
    ),
});

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const verify = useVerifyOtpMutation();
  const reset = useResetPasswordMutation();
  const [complete, setComplete] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: searchParams.get("email") ?? "",
      otp: "",
      newPassword: "",
    },
  });

  return (
    <AuthCard>
      <AuthHeader
        badge="Verification & Reset"
        badgeVariant="blue"
        title={
          <>
            Choose a new{" "}
            <span className="bg-gradient-to-r from-[#0052FF] via-[#1D63FF] to-[#38BDF8] bg-clip-text text-transparent">
              password
            </span>
          </>
        }
        subtitle="Verify your identity with the six-digit code and establish a new credential."
      />

      {complete ? (
        <div className="pt-6 space-y-5">
          <AuthNotice
            variant="emerald"
            title="Password Updated"
            icon={CheckCircle2}
          >
            Your account security credential has been successfully reset. You can now access your administrator console.
          </AuthNotice>

          <div className="pt-2">
            <Link
              href="/login"
              className="flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0052FF] px-6 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#0047E0] transition-colors cursor-pointer"
            >
              <span>Return to sign in</span>
            </Link>
          </div>
        </div>
      ) : (
        <form
          className="pt-6 space-y-5"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              const verified = await verify.mutateAsync({
                email: values.email,
                otp: values.otp,
                loginType: "ADMIN",
              });
              await reset.mutateAsync({
                resetToken: verified.resetToken,
                newPassword: values.newPassword,
              });
              setComplete(true);
              toast.success("Password updated. You can sign in now.");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Reset failed");
            }
          })}
        >
          {/* Admin Email */}
          <AuthFormField
            label="Administrator Email"
            id="reset-email"
            error={form.formState.errors.email?.message}
          >
            <div className="relative">
              <Input
                id="reset-email"
                type="email"
                placeholder="admin@example.com"
                disabled={verify.isPending || reset.isPending}
                className="pl-10"
                {...form.register("email")}
              />
              <Mail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </AuthFormField>

          {/* 6-Digit OTP */}
          <AuthFormField
            label="6-Digit Reset Code"
            id="reset-otp"
            error={form.formState.errors.otp?.message}
            helperText="Check your inbox for the authorization code"
          >
            <div className="relative">
              <Input
                id="reset-otp"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                disabled={verify.isPending || reset.isPending}
                className="pl-10 font-mono tracking-widest text-base"
                {...form.register("otp")}
              />
              <KeyRound
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </AuthFormField>

          {/* New Password */}
          <AuthFormField
            label="New Password"
            id="reset-password"
            error={form.formState.errors.newPassword?.message}
            helperText="8+ chars with uppercase, lowercase, number, and special character"
          >
            <PasswordInput
              id="reset-password"
              autoComplete="new-password"
              placeholder="Enter new master password"
              disabled={verify.isPending || reset.isPending}
              error={!!form.formState.errors.newPassword}
              {...form.register("newPassword")}
            />
          </AuthFormField>

          {/* Submit */}
          <div className="pt-2">
            <AuthPrimaryButton
              loading={verify.isPending || reset.isPending}
              type="submit"
            >
              Verify code and update password
            </AuthPrimaryButton>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0052FF] hover:underline cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to sign in</span>
            </Link>
          </div>
        </form>
      )}
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell cardMaxWidth="md">
      <Suspense
        fallback={
          <AuthCard>
            <div className="py-12 text-center text-xs text-slate-500 font-mono">
              Loading recovery session...
            </div>
          </AuthCard>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
