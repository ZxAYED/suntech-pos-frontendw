import { LocationManager } from "@/features/tenant/components/location-manager";

export const metadata = {
  title: "Manage Locations & Branches | SunTech POS",
  description: "Configure operational retail branches, warehouses, and POS lane registers",
};

export default function AdminLocationsPage() {
  return <LocationManager />;
}
