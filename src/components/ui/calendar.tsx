"use client";

import type { ComponentProps } from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import "react-day-picker/style.css";

export type CalendarProps = ComponentProps<typeof DayPicker>;

export function Calendar({ className, ...props }: CalendarProps) {
  return <DayPicker className={cn("p-2", className)} {...props} />;
}
