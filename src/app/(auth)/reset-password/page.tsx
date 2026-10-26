"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { BrandLogo } from "@/components/common/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useResetPasswordMutation, useVerifyOtpMutation } from "@/redux/api/authApi";

const schema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, "Enter the six-digit code"),
  newPassword: z.string().min(8).max(72).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, "Use uppercase, lowercase, number, and special character"),
});

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const verify = useVerifyOtpMutation();
  const reset = useResetPasswordMutation();
  const [complete, setComplete] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: searchParams.get("email") ?? "", otp: "", newPassword: "" },
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader><BrandLogo /><h1 className="pt-4 text-2xl font-bold tracking-tight text-secondary">Choose a new <span className="text-primary">password</span></h1></CardHeader>
      <CardContent>
        {complete ? <div className="space-y-4"><p className="text-sm text-slate-600">Password updated successfully.</p><Button asChild className="w-full"><Link href="/login">Return to sign in</Link></Button></div> : (
          <form className="space-y-4" onSubmit={form.handleSubmit(async (values) => {
            try {
              const verified = await verify.mutateAsync({ email: values.email, otp: values.otp, loginType: "ADMIN" });
              await reset.mutateAsync({ resetToken: verified.resetToken, newPassword: values.newPassword });
              setComplete(true);
              toast.success("Password updated. You can sign in now.");
            } catch (error) { toast.error(error instanceof Error ? error.message : "Reset failed"); }
          })}>
            <Input type="email" placeholder="Admin email" {...form.register("email")} /><p className="text-xs text-rose-600">{form.formState.errors.email?.message}</p>
            <Input inputMode="numeric" maxLength={6} placeholder="6-digit reset code" {...form.register("otp")} /><p className="text-xs text-rose-600">{form.formState.errors.otp?.message}</p>
            <Input type="password" autoComplete="new-password" placeholder="New password" {...form.register("newPassword")} /><p className="text-xs text-rose-600">{form.formState.errors.newPassword?.message}</p>
            <Button className="w-full" loading={verify.isPending || reset.isPending} type="submit">Verify code and update password</Button>
          </form>
        )}
        <Link className="mt-4 block text-center text-sm text-primary" href="/login">Back to login</Link>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return <main className="flex min-h-screen items-center justify-center bg-background p-6"><Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}><ResetPasswordForm /></Suspense></main>;
}
