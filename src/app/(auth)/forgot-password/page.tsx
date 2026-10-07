"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { BrandLogo } from "@/components/common/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForgotPasswordMutation } from "@/redux/api/authApi";

const schema = z.object({
  email: z.string().email(),
});

export default function ForgotPasswordPage() {
  const mutation = useForgotPasswordMutation();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <BrandLogo />
          <h1 className="pt-4 text-2xl font-bold tracking-tight text-secondary">
            Reset <span className="text-primary">access</span>
          </h1>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              try {
                await mutation.mutateAsync(values);
                toast.success("If that inbox exists, a reset link is on the way.");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Unable to send reset email");
              }
            })}
          >
            <Input placeholder="Admin email" type="email" {...form.register("email")} />
            <Button className="w-full" loading={mutation.isPending} type="submit">
              Send reset link
            </Button>
          </form>
          <Link className="mt-4 block text-center text-sm text-primary" href="/login">
            Back to login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
