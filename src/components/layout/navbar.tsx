"use client";

import { LogOut, MapPin } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logout } from "@/redux/actions/authActions";
import { AUTH_STORAGE_KEY, formatCentsToCurrency } from "@/lib/utils";
import type { RootState } from "@/redux/types";

function shiftElapsed(openedAt?: string) {
  if (!openedAt) return "—";
  const ms = Date.now() - new Date(openedAt).getTime();
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours}h ${minutes}m`;
}

export function Navbar() {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const shift = useSelector((state: RootState) => state.shift.active);

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-white px-6">
      <div className="flex items-center gap-3">
        {user?.locationName ? (
          <Badge variant="outline" className="gap-1">
            <MapPin className="h-3 w-3" />
            {user.locationName}
          </Badge>
        ) : null}
        {shift ? (
          <Badge>
            Shift open · {shiftElapsed(shift.openedAt)} · float {formatCentsToCurrency(shift.startingAmount)}
          </Badge>
        ) : (
          <Badge variant="pending">No active shift</Badge>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-secondary">{user?.displayName ?? "Guest"}</p>
          <p className="text-xs text-muted-foreground">{user?.role ?? "—"}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            window.localStorage.removeItem(AUTH_STORAGE_KEY);
            dispatch(logout());
            router.replace("/login");
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </header>
  );
}
