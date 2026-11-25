"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { clearAllAuthStorage, clearStoredUser } from "@/lib/auth-storage";
import { purgeLegacyMockStorage, tenantPreferences } from "@/lib/tenant-preferences";
import { logout } from "@/redux/actions/authActions";
import { clearCart } from "@/redux/actions/cartActions";
import { clearActiveShift } from "@/redux/actions/shiftActions";
import { hydrateTenant } from "@/redux/actions/tenantActions";
import { flushDrafts } from "@/features/offline/services/draft-flush";
import { offlineDb } from "@/features/offline/db/offline-db";
import { deactivateTrustedWorkspace } from "@/features/offline/core/grant";

export function useSignOut() {
  const [isPending, setIsPending] = useState(false);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const router = useRouter();

  return {
    isPending,
    signOut: async () => {
      if (isPending) return;
      setIsPending(true);
      try { await flushDrafts(); }
      catch { setIsPending(false); toast.error("Your current cart could not be saved. Keep this screen open and resolve the storage error before signing out."); return; }
      window.dispatchEvent(new Event("suntech:lock"));
      await deactivateTrustedWorkspace(offlineDb, "logged_out").catch(() => undefined);
      let revoked = true;
      try {
        const res = await apiClient.post<{ loggedOut?: boolean; serverLogoutConfirmed?: boolean }>(
          "/auth/logout",
          {},
        );
        if (res.data?.serverLogoutConfirmed === false) {
          revoked = false;
        }
      } catch {
        revoked = false;
      }
      await fetch("/api/session", { method: "DELETE", credentials: "same-origin" }).catch(() => undefined);
      queryClient.clear();
      clearAllAuthStorage();
      tenantPreferences.clearAll();
      purgeLegacyMockStorage();
      clearStoredUser();
      dispatch(clearCart());
      dispatch(clearActiveShift());
      dispatch(hydrateTenant(null));
      dispatch(logout());
      if (!revoked) toast.warning("Signed out locally. Server revocation could not be confirmed while disconnected.");
      router.replace("/login");
      router.refresh();
    },
  };
}
