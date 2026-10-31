"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Mail, ArrowLeft } from "lucide-react";
import {
  AuthShell,
  AuthCard,
  AuthHeader,
  AuthFormField,
  AuthPrimaryButton,
} from "@/features/auth/components";
import { Input } from "@/components/ui/input";
import { useForgotPasswordMutation } from "@/redux/api/authApi";

const schema = z.object({
  email: z.string().email("Please enter a valid administrator email address"),
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const mutation = useForgotPasswordMutation();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  return (
    <AuthShell cardMaxWidth="md">
      <AuthCard>
        <AuthHeader
          badge="Password Recovery"
          badgeVariant="blue"
          title={
            <>
              Reset your{" "}
              <span className="bg-gradient-to-r from-[#0052FF] via-[#1D63FF] to-[#38BDF8] bg-clip-text text-transparent">
                access
              </span>
            </>
          }
          subtitle="Enter your verified administrator email to receive a six-digit recovery code."
        />

        <form
          className="pt-6 space-y-5"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await mutation.mutateAsync(values);
              toast.success("If that inbox exists, a recovery code is on the way.");
              router.push(`/reset-password?email=${encodeURIComponent(values.email)}`);
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "Unable to send reset email"
              );
            }
          })}
        >
          <AuthFormField
            label="Administrator Email"
            id="forgot-email"
            error={form.formState.errors.email?.message}
          >
            <div className="relative">
              <Input
                id="forgot-email"
                placeholder="admin@example.com"
                type="email"
                autoComplete="email"
                disabled={mutation.isPending}
                className="pl-10"
                {...form.register("email")}
              />
              <Mail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </AuthFormField>

          <div className="pt-2">
            <AuthPrimaryButton loading={mutation.isPending} type="submit">
              Send recovery code
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
      </AuthCard>
    </AuthShell>
  );
}
