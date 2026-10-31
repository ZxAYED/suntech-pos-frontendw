import { AuditLogsView } from "@/features/audit/components/audit-logs-view";

export const metadata = {
  title: "Audit Logs & Governance | SunTech POS",
  description: "View business activity audit trails, state mutations, and user events.",
};

export default function AdminAuditLogsPage() {
  return <AuditLogsView />;
}
