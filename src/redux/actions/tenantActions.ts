import {
  TENANT_SET_BUSINESS,
  TENANT_SET_BRANCH,
  TENANT_SET_SELECTION,
  TENANT_SET_AVAILABLE_BUSINESSES,
  TENANT_HYDRATE,
  type TenantAction,
  type BusinessItem,
  type BranchItem,
} from "@/redux/types";

export function setBusiness(business: BusinessItem | null): TenantAction {
  return { type: TENANT_SET_BUSINESS, payload: business };
}

export function setBranch(branch: BranchItem | null): TenantAction {
  return { type: TENANT_SET_BRANCH, payload: branch };
}

export function setTenantSelection(payload: {
  business: BusinessItem;
  branch: BranchItem;
}): TenantAction {
  return { type: TENANT_SET_SELECTION, payload };
}

export function setAvailableBusinesses(businesses: BusinessItem[]): TenantAction {
  return { type: TENANT_SET_AVAILABLE_BUSINESSES, payload: businesses };
}

export function hydrateTenant(
  payload: { business: BusinessItem; branch: BranchItem } | null,
): TenantAction {
  return { type: TENANT_HYDRATE, payload };
}
