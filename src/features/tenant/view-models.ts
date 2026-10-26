import type { Business, Location } from "@/types/domain";
import type { BranchItem, BusinessItem } from "@/redux/types";

export function mapLocationToBranch(location: Location): BranchItem {
  return {
    id: location.id,
    businessId: location.businessId,
    name: location.name,
    code: location.code ?? "",
    address: location.address ?? null,
    status: location.status ?? "ACTIVE",
    createdAt: location.createdAt,
    updatedAt: location.updatedAt,
  };
}

export function mapBusinessToTenantCard(business: Business): BusinessItem {
  return {
    id: business.id,
    name: business.name,
    code: business.code ?? "",
    status: business.status ?? "ACTIVE",
    profileImageUrl: business.profileImageUrl ?? null,
    createdAt: business.createdAt,
    updatedAt: business.updatedAt,
    branches: (business.locations ?? []).map(mapLocationToBranch),
  };
}
