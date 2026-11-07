import type { Metadata } from "next";
import { HelpView } from "@/features/help/components/help-view";
import { cashierHelpData } from "@/features/help/data/cashier-help-data";

export const metadata: Metadata = {
  title: "Help — Cashier",
};

export default function CashierHelpPage() {
  return <HelpView guide={cashierHelpData} />;
}

