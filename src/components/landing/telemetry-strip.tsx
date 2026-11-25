import { Activity, Building2, Database, Radio, ShieldCheck } from "lucide-react";
import { Container } from "@/components/common/container";
import { StaggerGroup, StaggerItem } from "@/components/motion/motion-reveal";

const metrics = [
  { icon: Radio, label: "System status", value: "Online" },
  { icon: Activity, label: "Response time", value: "< 10 ms" },
  { icon: Database, label: "Database", value: "Multi-tenant SQL" },
  { icon: Building2, label: "Active branch", value: "Uttara Doyel" },
  { icon: ShieldCheck, label: "Inventory sync", value: "Real time" },
];

export function TelemetryStrip() {
  return (
    <section aria-label="System overview" className="bg-[#111d3d] text-white">
      <Container>
        <StaggerGroup className="grid grid-cols-2 gap-y-5 py-5 sm:grid-cols-3 lg:grid-cols-5 lg:py-6">
          {metrics.map(({ icon: Icon, label, value }) => (
            <StaggerItem key={label} className="flex items-center gap-3 lg:border-l lg:border-white/15 lg:pl-6 lg:first:border-l-0 lg:first:pl-0">
              <Icon size={19} strokeWidth={1.6} className="shrink-0 text-blue-300" aria-hidden />
              <div>
                <p className="text-[11px] text-slate-300">{label}</p>
                <p className="mt-0.5 text-sm font-medium">{value}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Container>
    </section>
  );
}
