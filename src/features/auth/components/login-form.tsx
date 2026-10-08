"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/common/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"admin" | "cashier">("admin");
  const [adminEmail, setAdminEmail] = useState("admin@suntechpos.bd");
  const [adminPassword, setAdminPassword] = useState("••••••••");
  const [cashierPublicId, setCashierPublicId] = useState("CSH-JAMUNA-01");
  const [cashierPin, setCashierPin] = useState("1234");
  const [loading, setLoading] = useState(false);

  const handleAdminSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Welcome, Store Administrator! Accessing cockpit...");
      router.push("/admin/dashboard");
    }, 400);
  };

  const handleCashierSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Cashier session authorized. Opening POS terminal...");
      router.push("/pos/terminal");
    }, 400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-md"
    >
      <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="space-y-3 pb-4 border-b border-slate-100">
          <div className="flex justify-between items-center">
            <BrandLogo size="md" href="/" />
            <span className="text-[11px] font-medium text-[#0052FF] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              Demo Access
            </span>
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#070B28]">
              Sign in to SunTech POS
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Select your role to access the register terminal or admin cockpit.
            </p>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Framer Motion Role Tabs */}
          <div className="grid grid-cols-2 gap-1 rounded-md border border-slate-200 bg-slate-100/80 p-1 mb-5">
            <button
              type="button"
              onClick={() => setActiveTab("admin")}
              className={`relative flex items-center justify-center gap-1.5 rounded-sm py-2 text-xs font-medium cursor-pointer select-none transition-colors ${
                activeTab === "admin"
                  ? "text-[#070B28]"
                  : "text-slate-500 hover:text-[#070B28]"
              }`}
            >
              {activeTab === "admin" && (
                <motion.div
                  layoutId="activeAuthTab"
                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  className="absolute inset-0 rounded-sm bg-white shadow-xs"
                />
              )}
              <ShieldCheck className="relative z-10 h-3.5 w-3.5 text-[#0052FF]" />
              <span className="relative z-10">Store Admin</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("cashier")}
              className={`relative flex items-center justify-center gap-1.5 rounded-sm py-2 text-xs font-medium cursor-pointer select-none transition-colors ${
                activeTab === "cashier"
                  ? "text-[#070B28]"
                  : "text-slate-500 hover:text-[#070B28]"
              }`}
            >
              {activeTab === "cashier" && (
                <motion.div
                  layoutId="activeAuthTab"
                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  className="absolute inset-0 rounded-sm bg-white shadow-xs"
                />
              )}
              <UserCheck className="relative z-10 h-3.5 w-3.5 text-[#0052FF]" />
              <span className="relative z-10">Terminal Cashier</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "admin" ? (
              <motion.form
                key="admin-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleAdminSubmit}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-email"
                    className="text-xs font-medium text-[#070B28]"
                  >
                    Administrator Email
                  </label>
                  <Input
                    id="admin-email"
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@suntechpos.bd"
                    className="h-9 border-slate-200 text-xs bg-white text-[#070B28] focus-visible:border-[#0052FF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label
                      htmlFor="admin-password"
                      className="text-xs font-medium text-[#070B28]"
                    >
                      Master Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-[11px] font-medium text-[#0052FF] hover:underline cursor-pointer"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <Input
                    id="admin-password"
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter password"
                    className="h-9 border-slate-200 text-xs bg-white text-[#070B28] focus-visible:border-[#0052FF]"
                  />
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full h-10 bg-[#0052FF] hover:bg-[#0047E0] text-white font-medium text-xs shadow-xs cursor-pointer"
                >
                  <span>Launch Admin Cockpit</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="cashier-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleCashierSubmit}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="cashier-id"
                    className="text-xs font-medium text-[#070B28]"
                  >
                    Cashier Terminal Public ID
                  </label>
                  <Input
                    id="cashier-id"
                    type="text"
                    required
                    value={cashierPublicId}
                    onChange={(e) => setCashierPublicId(e.target.value.toUpperCase())}
                    placeholder="CSH-JAMUNA-01"
                    className="h-9 uppercase font-mono border-slate-200 text-xs bg-white text-[#070B28] focus-visible:border-[#0052FF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="cashier-pin"
                    className="text-xs font-medium text-[#070B28]"
                  >
                    Register Access PIN
                  </label>
                  <Input
                    id="cashier-pin"
                    type="password"
                    required
                    maxLength={6}
                    value={cashierPin}
                    onChange={(e) => setCashierPin(e.target.value)}
                    placeholder="Enter 4-digit PIN"
                    className="h-9 font-mono border-slate-200 text-xs bg-white text-[#070B28] focus-visible:border-[#0052FF]"
                  />
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full h-10 bg-[#0052FF] hover:bg-[#0047E0] text-white font-medium text-xs shadow-xs cursor-pointer"
                >
                  <span>Authorize & Open Register</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Quick Demo Fill Helper */}
          <div className="mt-5 rounded-md border border-slate-200/80 bg-slate-50 p-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Instant Mockup Testing</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Pre-filled with valid mockup credentials. Simply click the button above to test either role.
            </p>
          </div>

          {/* Bottom Link to Register Shop */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
            <span>Need to register a new retail outlet? </span>
            <Link
              href="/register"
              className="font-medium text-[#0052FF] hover:underline cursor-pointer"
            >
              Create Account
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
