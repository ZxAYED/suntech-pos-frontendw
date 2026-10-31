"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Clock } from "lucide-react";
import { toast } from "sonner";
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
import { useRegisterMutation } from "@/redux/api/authApi";
import { registerSchema } from "@/lib/validations";

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegisterMutation();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = registerSchema.safeParse({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      phoneNumber: phoneNumber.trim() || undefined,
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || "Invalid registration form");
      return;
    }

    try {
      await register.mutateAsync({
        fullName: validation.data.fullName,
        email: validation.data.email,
        password: validation.data.password,
        phoneNumber: validation.data.phoneNumber || undefined,
      });
      toast.success("Registration submitted for approval.");
      router.replace("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    }
  };

  return (
    <AuthShell cardMaxWidth="lg">
      <AuthCard>
        {/* Brand & Editorial Title Header */}
        <AuthHeader
          badge="Store Admin Registration"
          badgeVariant="blue"
          title={
            <>
              Start with{" "}
              <span className="bg-gradient-to-r from-[#0052FF] via-[#1D63FF] to-[#38BDF8] bg-clip-text text-transparent">
                SunTech POS
              </span>
            </>
          }
          subtitle="Create your store administrator profile for platform onboarding."
        />

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="pt-6 space-y-5">
          {/* Full Name */}
          <AuthFormField label="Full Name" id="owner-name">
            <div className="relative">
              <Input
                id="owner-name"
                required
                maxLength={120}
                disabled={register.isPending}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="e.g. Ahmed Khan"
                className="pl-10"
              />
              <User
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </AuthFormField>

          {/* Business Email & Phone (Side-by-side on desktop, stacked on mobile) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AuthFormField label="Business Email" id="reg-email">
              <div className="relative">
                <Input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={register.isPending}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="owner@example.com"
                  className="pl-10"
                />
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            </AuthFormField>

            <AuthFormField label="Phone (Optional)" id="reg-phone">
              <div className="relative">
                <Input
                  id="reg-phone"
                  autoComplete="tel"
                  minLength={8}
                  maxLength={20}
                  disabled={register.isPending}
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="+880 1712-345678"
                  className="pl-10"
                />
                <Phone
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            </AuthFormField>
          </div>

          {/* Password with guidance */}
          <AuthFormField
            label="Master Password"
            id="reg-password"
            helperText="8+ characters with uppercase, lowercase, number, and special symbol"
          >
            <PasswordInput
              id="reg-password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
              disabled={register.isPending}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a strong password"
            />
          </AuthFormField>

          {/* Approval Notification Notice */}
          <AuthNotice
            variant="amber"
            title="Super Admin Approval Required"
            icon={Clock}
          >
            Registration provisions a pending Admin account. A SunTech platform Super Admin will verify and activate your store access.
          </AuthNotice>

          {/* Submit CTA */}
          <div className="pt-2">
            <AuthPrimaryButton loading={register.isPending} type="submit">
              Submit registration for review
            </AuthPrimaryButton>
          </div>

          {/* Footer Back to Login */}
          <div className="pt-3 border-t border-slate-100 text-center text-xs text-[#58647A]">
            Already have an approved account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#0052FF] hover:underline cursor-pointer"
            >
              Sign in
            </Link>
          </div>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
