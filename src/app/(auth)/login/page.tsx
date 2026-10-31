import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = {
  title: "Sign In — SunTech POS",
  description: "Sign in to your SunTech POS store administrator or cashier account.",
};

export default function LoginPage() {
  return (
    <AuthShell cardMaxWidth="md">
      <LoginForm />
    </AuthShell>
  );
}
