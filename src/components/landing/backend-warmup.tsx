"use client";

import { useEffect, useRef } from "react";

export function BackendWarmup() {
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (triggeredRef.current) return;
    triggeredRef.current = true;

    // Completely silent background ping when landing page finishes loading
    const silentPing = () => {
      fetch("/api/warmup", {
        method: "GET",
        cache: "no-store",
        keepalive: true,
      }).catch(() => {
        // 100% silent: no UI alerts, no console messages
      });
    };

    if (typeof window !== "undefined") {
      if (document.readyState === "complete") {
        silentPing();
      } else {
        window.addEventListener("load", silentPing, { once: true });
      }
    }
  }, []);

  return null;
}
