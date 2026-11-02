"use client";

import { useSelector } from "react-redux";
import type { RootState } from "@/redux/types";

export function useCurrentUserId(): string {
  return useSelector((state: RootState) => state.auth.user?.id ?? "anonymous");
}
