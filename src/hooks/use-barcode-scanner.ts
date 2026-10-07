"use client";

import { useEffect, useRef } from "react";

export function useBarcodeScanner(onScan: (code: string) => void, enabled = true) {
  const bufferRef = useRef("");
  const lastKeyRef = useRef(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyRef.current > 80) {
        bufferRef.current = "";
      }
      lastKeyRef.current = now;

      if (event.key === "Enter") {
        if (bufferRef.current.length >= 4) {
          onScanRef.current(bufferRef.current);
        }
        bufferRef.current = "";
        return;
      }

      if (event.key.length === 1) {
        bufferRef.current += event.key;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
