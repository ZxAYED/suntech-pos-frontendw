"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { BrandLogo } from "@/components/common/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useResetPasswordMutation } from "@/redux/api/authApi";

const schema = z.object({
  password: z.string().min(6),
});

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const mutation = useResetPasswordMutation();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "" },
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <BrandLogo />
        <h1 className="pt-4 text-2xl font-bold tracking-tight text-secondary">
          Choose a new <span className="text-primary">password</span>
        </h1>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await mutation.mutateAsync({ token, password: values.password });
              toast.success("Password updated. You can sign in now.");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Reset failed");
            }
          })}
        >
          <Input type="password" placeholder="New password" {...form.register("password")} />
          <Button className="w-full" loading={mutation.isPending} type="submit">
            Update password
          </Button>
        </form>
        <Link className="mt-4 block text-center text-sm text-primary" href="/login">
          Back to login
        </Link>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
