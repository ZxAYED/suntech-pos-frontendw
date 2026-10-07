"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { z } from "zod";
import { BrandLogo } from "@/components/common/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AUTH_STORAGE_KEY } from "@/lib/utils";
import { setAuthCookies } from "@/lib/auth-cookie";
import { setCredentials } from "@/redux/actions/authActions";
import { useLoginMutation } from "@/redux/api/authApi";

const adminSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const cashierSchema = z.object({
  publicId: z
    .string()
    .min(5, "Enter a cashier public ID")
    .transform((value) => value.toUpperCase()),
  password: z.string().min(4, "Password is required"),
});

type AdminValues = z.infer<typeof adminSchema>;
type CashierValues = z.infer<typeof cashierSchema>;

export function LoginForm() {
  const router = useRouter();
  const dispatch = useDispatch();
  const login = useLoginMutation();

  const adminForm = useForm<AdminValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: { email: "", password: "" },
  });

  const cashierForm = useForm<CashierValues>({
    resolver: zodResolver(cashierSchema),
    defaultValues: { publicId: "", password: "" },
  });

  async function onAdmin(values: AdminValues) {
    try {
      const session = await login.mutateAsync({
        loginType: "ADMIN",
        email: values.email,
        password: values.password,
      });
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      setAuthCookies(session.accessToken, session.user.role);
      dispatch(setCredentials(session));
      router.replace("/admin/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    }
  }

  async function onCashier(values: CashierValues) {
    try {
      const session = await login.mutateAsync({
        loginType: "BUSINESS_USER",
        publicId: values.publicId.toUpperCase(),
        password: values.password,
      });
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      setAuthCookies(session.accessToken, session.user.role);
      dispatch(setCredentials(session));
      router.replace("/pos/terminal");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <BrandLogo />
        <p className="pt-4 text-2xl font-bold tracking-tight text-secondary">
          Sign in to <span className="text-primary">Suntech POS</span>
        </p>
        <p className="text-sm text-muted-foreground">Admin email or cashier public ID.</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="admin">
          <TabsList className="w-full">
            <TabsTrigger className="flex-1" value="admin">
              Admin
            </TabsTrigger>
            <TabsTrigger className="flex-1" value="cashier">
              Cashier
            </TabsTrigger>
          </TabsList>
          <TabsContent value="admin">
            <form className="space-y-4" onSubmit={adminForm.handleSubmit(onAdmin)}>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="email">
                  Email
                </label>
                <Input id="email" type="email" {...adminForm.register("email")} />
                {adminForm.formState.errors.email ? (
                  <p className="text-xs text-destructive">{adminForm.formState.errors.email.message}</p>
                ) : null}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="admin-password">
                  Password
                </label>
                <Input id="admin-password" type="password" {...adminForm.register("password")} />
                {adminForm.formState.errors.password ? (
                  <p className="text-xs text-destructive">{adminForm.formState.errors.password.message}</p>
                ) : null}
              </div>
              <Button className="w-full" loading={login.isPending} type="submit">
                Continue as admin
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="cashier">
            <form className="space-y-4" onSubmit={cashierForm.handleSubmit(onCashier)}>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="publicId">
                  Public ID
                </label>
                <Input
                  id="publicId"
                  className="uppercase"
                  placeholder="CSH-XXXXX"
                  {...cashierForm.register("publicId", {
                    onChange: (event) => {
                      event.target.value = event.target.value.toUpperCase();
                    },
                  })}
                />
                {cashierForm.formState.errors.publicId ? (
                  <p className="text-xs text-destructive">{cashierForm.formState.errors.publicId.message}</p>
                ) : null}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="cashier-password">
                  Password
                </label>
                <Input id="cashier-password" type="password" {...cashierForm.register("password")} />
                {cashierForm.formState.errors.password ? (
                  <p className="text-xs text-destructive">{cashierForm.formState.errors.password.message}</p>
                ) : null}
              </div>
              <Button className="w-full" loading={login.isPending} type="submit">
                Open register
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link className="text-primary hover:underline" href="/forgot-password">
            Forgot password?
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
