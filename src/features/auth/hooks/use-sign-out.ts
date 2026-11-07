"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { clearStoredUser } from "@/lib/auth-storage";
import { purgeLegacyMockStorage } from "@/lib/tenant-preferences";
import { logout } from "@/redux/actions/authActions";
import { clearCart } from "@/redux/actions/cartActions";
import { clearActiveShift } from "@/redux/actions/shiftActions";
import { hydrateTenant } from "@/redux/actions/tenantActions";

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
