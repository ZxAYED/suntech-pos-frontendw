"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, UserCheck } from "lucide-react";

export type AuthMode = "admin" | "cashier";

interface AuthModeSwitcherProps {
  activeMode: AuthMode;
  onChange: (mode: AuthMode) => void;
  disabled?: boolean;
}

export function AuthModeSwitcher({
  activeMode,
  onChange,
  disabled = false,
}: AuthModeSwitcherProps) {
  const reduceMotion = useReducedMotion();

  const modes = [
    {
      id: "admin" as const,
      label: "Admin",
      descriptor: "Email & Password",
      icon: ShieldCheck,
    },
    {
      id: "cashier" as const,
      label: "Cashier",
      descriptor: "Terminal Public ID",
      icon: UserCheck,
    },
  ];

  return (
    <div
      role="tablist"
      aria-label="Select Sign In Mode"
      className="inline-flex w-full items-center rounded-xl bg-[#0A1138] p-1.5 shadow-md border border-white/10"
    >
      {modes.map((mode) => {
        const active = activeMode === mode.id;
        const Icon = mode.icon;

        return (
          <motion.button
            key={mode.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`panel-${mode.id}`}
            id={`tab-${mode.id}`}
            disabled={disabled}
            onClick={() => onChange(mode.id)}
            whileHover={reduceMotion || disabled ? {} : { scale: 1.01 }}
            whileTap={reduceMotion || disabled ? {} : { scale: 0.99 }}
            className={`relative flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0052FF] disabled:cursor-not-allowed disabled:opacity-50 ${
              active ? "text-[#0A1138]" : "text-slate-300 hover:text-white"
            }`}
          >
            {active && (
              <motion.div
                layoutId="authModeTabIndicator"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 450, damping: 32 }
                }
                className="absolute inset-0 rounded-lg bg-white shadow-xs"
              />
            )}
            <Icon
              className={`relative z-10 h-4 w-4 transition-colors ${
                active ? "text-[#0052FF]" : "text-slate-400"
              }`}
              aria-hidden="true"
            />
            <span className="relative z-10">{mode.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
