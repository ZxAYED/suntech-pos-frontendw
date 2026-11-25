"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

export function LandingMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="never">{children}</MotionConfig>;
}
