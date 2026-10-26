import { ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";

export default function SuperAdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Platform Administration" />
      <Card className="border-slate-200 p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-blue-50 p-3 text-[#0052FF]"><ShieldCheck className="h-6 w-6" /></div>
          <div><h2 className="font-semibold text-[#070B28]">Role-safe landing</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">Your session is authenticated as Super Admin. Platform user approval and status APIs are scheduled for a later integration phase; store Admin tenant controls are intentionally not exposed here.</p></div>
        </div>
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500"><Users className="h-4 w-4" />Platform user management is not yet integrated.</div>
      </Card>
    </div>
  );
}
