import { BusinessBranchHub } from "@/features/tenant/components/business-branch-hub";

export const metadata = {
  title: "Manage Locations & Branches | SunTech POS",
  description: "Configure operational retail branches, warehouses, and POS lane registers",
};

export default function AdminLocationsPage() {
  return <BusinessBranchHub initialStep={2} />;
}
