import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-6 selection:bg-[#0052FF] selection:text-white">
      <LoginForm />
    </main>
  );
}
