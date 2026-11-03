import type { Metadata } from "next";
import { HelpView } from "@/features/help/components/help-view";
import { adminHelpData } from "@/features/help/data/admin-help-data";

export const metadata: Metadata = {
  title: "Help — Admin",
};

export default function AdminHelpPage() {
  return <HelpView guide={adminHelpData} />;
}

