import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useSelector } from "react-redux";
import { Providers } from "@/app/providers";
import DashboardLayout from "@/app/(dashboard)/layout";
import { TerminalWorkspace } from "@/features/pos/components/terminal-workspace";
import { CustomSaleView } from "@/features/pos/components/custom-sale-view";
import { OrdersWorkspace } from "@/features/pos/components/orders-workspace";
import { usePathname, useRouter } from "./navigation";
import { BusinessBranchHub } from "@/features/tenant/components/business-branch-hub";
import { CatalogManager } from "@/features/catalog/components/catalog-manager";
import { HelpView } from "@/features/help/components/help-view";
import { adminHelpData } from "@/features/help/data/admin-help-data";
import { cashierHelpData } from "@/features/help/data/cashier-help-data";
import { useOffline } from "../ui/offline-provider";
import type { RootState } from "@/redux/types";

function OfflineSignedOutNotice() {
  return (
    <main className="grid min-h-screen place-content-center gap-4 bg-slate-50 p-6 text-center font-sans">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
        <h1 className="text-xl font-bold text-[#070B28]">Offline — Sign In Required</h1>
        <p className="text-sm text-slate-600">
          This terminal is currently signed out. Connect to the server to sign in and continue operations.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-lg bg-[#0052FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0047E0] cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    </main>
  );
}

function ExistingScreen() {
  const pathname = usePathname();
  const router = useRouter();
  const offline = useOffline();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const role = authUser
    ? authUser.role === "ADMIN"
      ? "admin"
      : "cashier"
    : pathname.startsWith("/admin")
      ? "admin"
      : "cashier";

  useEffect(() => {
    if (authUser && (pathname === "/login" || pathname === "/")) {
      const target = authUser.role === "ADMIN" ? "/admin/terminal" : "/pos/terminal";
      router.replace(target);
    }
  }, [authUser, pathname, router]);

  if (!authUser) {
    if (offline.error) {
      return (
        <main className="grid min-h-screen place-content-center gap-4 bg-slate-50 p-6 text-center font-sans">
          <div className="max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-xs space-y-3">
            <h1 className="text-xl font-bold text-[#070B28]">Offline Access Unavailable</h1>
            <p className="text-sm text-amber-900">{offline.error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-lg bg-[#0052FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0047E0] cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        </main>
      );
    }
    return <OfflineSignedOutNotice />;
  }

  if (pathname === "/login" || pathname === "/") {
    return <DashboardLayout><TerminalWorkspace role={role} /></DashboardLayout>;
  }

  const screen =
    pathname.endsWith("/terminal") || pathname === "/pos" || pathname === "/admin" ? (
      <TerminalWorkspace role={role} />
    ) : pathname.endsWith("/custom-sale") ? (
      <CustomSaleView role={role} />
    ) : pathname.endsWith("/orders") ? (
      <OrdersWorkspace role={role} />
    ) : pathname === "/admin/select-business" ? (
      <BusinessBranchHub />
    ) : pathname === "/admin/catalog" ? (
      <CatalogManager />
    ) : pathname.endsWith("/help") ? (
      <HelpView guide={role === "admin" ? adminHelpData : cashierHelpData} />
    ) : (
      <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
        <h1 className="text-lg font-bold text-[#070B28]">This page needs an active connection</h1>
        <p className="text-sm text-slate-600">
          Your saved sales remain safely stored on this device. Reconnect to open this section.
        </p>
        <a
          className="inline-flex items-center rounded-lg bg-[#0052FF] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0047E0]"
          href={`/${role === "admin" ? "admin" : "pos"}/terminal`}
        >
          Return to POS Register
        </a>
      </section>
    );

  return <DashboardLayout>{screen}</DashboardLayout>;
}

createRoot(document.getElementById("suntech-offline-root")!).render(
  <Providers>
    <ExistingScreen />
  </Providers>,
);
