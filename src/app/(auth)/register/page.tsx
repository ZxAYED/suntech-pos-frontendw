"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Building2, CheckCircle2, Store } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/common/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [storeType, setStoreType] = useState<"single" | "multi">("single");
  const [shopName, setShopName] = useState("Gadget Arena Bangladesh");
  const [ownerName, setOwnerName] = useState("Tanvir Ahmed");
  const [email, setEmail] = useState("tanvir@gadgetarena.bd");
  const [phone, setPhone] = useState("+880 1711-889900");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Store successfully registered! Initializing terminal cockpit...");
      router.push("/admin/dashboard");
    }, 500);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-6 selection:bg-[#0052FF] selection:text-white">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
          <CardHeader className="space-y-3 pb-4 border-b border-slate-100">
            <div className="flex justify-between items-center">
              <BrandLogo size="md" href="/" />
              <span className="text-[11px] font-semibold text-[#0052FF] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                New Merchant
              </span>
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#070B28]">
                Register Retail Store
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Set up your mobile gadget store or multi-outlet chain in minutes.
              </p>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {/* Store Plan Selection Tabs */}
            <div className="grid grid-cols-2 gap-1 rounded-md border border-slate-200 bg-slate-100/80 p-1 mb-5">
              <button
                type="button"
                onClick={() => setStoreType("single")}
                className={`relative flex items-center justify-center gap-1.5 rounded-sm py-2 text-xs font-semibold cursor-pointer select-none transition-colors ${
                  storeType === "single"
                    ? "text-[#070B28]"
                    : "text-slate-500 hover:text-[#070B28]"
                }`}
              >
                {storeType === "single" && (
                  <motion.div
                    layoutId="activeRegisterPlan"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    className="absolute inset-0 rounded-sm bg-white shadow-xs"
                  />
                )}
                <Store className="relative z-10 h-3.5 w-3.5 text-[#0052FF]" />
                <span className="relative z-10">Single Outlet (1-3 Lanes)</span>
              </button>

              <button
                type="button"
                onClick={() => setStoreType("multi")}
                className={`relative flex items-center justify-center gap-1.5 rounded-sm py-2 text-xs font-semibold cursor-pointer select-none transition-colors ${
                  storeType === "multi"
                    ? "text-[#070B28]"
                    : "text-slate-500 hover:text-[#070B28]"
                }`}
              >
                {storeType === "multi" && (
                  <motion.div
                    layoutId="activeRegisterPlan"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    className="absolute inset-0 rounded-sm bg-white shadow-xs"
                  />
                )}
                <Building2 className="relative z-10 h-3.5 w-3.5 text-[#0052FF]" />
                <span className="relative z-10">Multi-Chain Hub</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="shop-name" className="text-xs font-semibold text-[#070B28]">
                    Store / Shop Name
                  </label>
                  <Input
                    id="shop-name"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Gadget Arena"
                    className="h-9 border-slate-200 text-xs bg-white text-[#070B28] focus-visible:border-[#0052FF]"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="owner-name" className="text-xs font-semibold text-[#070B28]">
                    Store Owner / Lead
                  </label>
                  <Input
                    id="owner-name"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Tanvir Ahmed"
                    className="h-9 border-slate-200 text-xs bg-white text-[#070B28] focus-visible:border-[#0052FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="reg-email" className="text-xs font-semibold text-[#070B28]">
                    Business Email
                  </label>
                  <Input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tanvir@gadgetarena.bd"
                    className="h-9 border-slate-200 text-xs bg-white text-[#070B28] focus-visible:border-[#0052FF]"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="reg-phone" className="text-xs font-semibold text-[#070B28]">
                    Phone (Bangladesh)
                  </label>
                  <Input
                    id="reg-phone"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1711-XXXXXX"
                    className="h-9 border-slate-200 text-xs bg-white text-[#070B28] font-mono focus-visible:border-[#0052FF]"
                  />
                </div>
              </div>

              <div className="rounded-md border border-slate-200/80 bg-slate-50 p-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Included in Free Sandbox Tier:</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Unlimited local register lanes, offline sync engine, and 10,000 BDT mock float balance.
                </p>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full h-10 bg-[#0052FF] hover:bg-[#0047E0] text-white font-semibold text-xs shadow-xs cursor-pointer mt-2"
              >
                <span>Complete Registration & Open Dashboard</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
              <span>Already registered your store? </span>
              <Link
                href="/login"
                className="font-semibold text-[#0052FF] hover:underline cursor-pointer"
              >
                Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
