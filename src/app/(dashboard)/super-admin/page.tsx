import { SuperAdminUsers } from "@/features/super-admin/components/super-admin-users";

export const metadata = {
  title: "Platform Administration | SunTech POS",
  description: "Review and approve store admin registrations, manage account statuses.",
};

export default function SuperAdminPage() {
  return <SuperAdminUsers />;
}
