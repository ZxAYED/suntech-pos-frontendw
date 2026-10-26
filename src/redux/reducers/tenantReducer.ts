import { mockBusinesses } from "@/mocks/tenant/data";
import { mapBusinessToTenantCard } from "@/features/tenant/view-models";
import {
  TENANT_HYDRATE,
  TENANT_SET_AVAILABLE_BUSINESSES,
  TENANT_SET_BRANCH,
  TENANT_SET_BUSINESS,
  TENANT_SET_SELECTION,
  type BranchItem,
  type BusinessItem,
  type TenantAction,
  type TenantState,
} from "@/redux/types";

export const TENANT_STORAGE_KEY = "suntech_active_tenant";
export const TENANT_BUSINESSES_STORAGE_KEY = "suntech_mock_businesses";
export const mockTenantBusinesses: BusinessItem[] = mockBusinesses.map(mapBusinessToTenantCard);

function persistTenant(business: BusinessItem | null, branch: BranchItem | null) {
  if (typeof window === "undefined") return;
  try {
    if (!business || !branch) {
      window.localStorage.removeItem(TENANT_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify({ business, branch }));
  } catch {
    // Preview persistence is optional and never authoritative application state.
  }
}

export function persistAvailableBusinesses(businesses: BusinessItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TENANT_BUSINESSES_STORAGE_KEY, JSON.stringify(businesses));
  } catch {
    // Ignore unavailable storage.
  }
}

const initialState: TenantState = {
  selectedBusiness: null,
  selectedBranch: null,
  availableBusinesses: mockTenantBusinesses,
  hydrated: false,
};

export function tenantReducer(
  state: TenantState = initialState,
  action: TenantAction,
): TenantState {
  switch (action.type) {
    case TENANT_SET_AVAILABLE_BUSINESSES:
      persistAvailableBusinesses(action.payload);
      return { ...state, availableBusinesses: action.payload };
    case TENANT_SET_BUSINESS: {
      const business = action.payload;
      const selectedBranch =
        business?.branches.find((branch) => branch.id === state.selectedBranch?.id) ?? null;
      persistTenant(business, selectedBranch);
      return { ...state, selectedBusiness: business, selectedBranch };
    }
    case TENANT_SET_BRANCH:
      persistTenant(state.selectedBusiness, action.payload);
      return { ...state, selectedBranch: action.payload };
    case TENANT_SET_SELECTION:
      persistTenant(action.payload.business, action.payload.branch);
      return {
        ...state,
        selectedBusiness: action.payload.business,
        selectedBranch: action.payload.branch,
        hydrated: true,
      };
    case TENANT_HYDRATE:
      return {
        ...state,
        selectedBusiness: action.payload?.business ?? null,
        selectedBranch: action.payload?.branch ?? null,
        hydrated: true,
      };
    default:
      return state;
  }
}

export function selectActiveBusiness(state: { tenant: TenantState }) {
  return state.tenant.selectedBusiness;
}

export function selectActiveBranch(state: { tenant: TenantState }) {
  return state.tenant.selectedBranch;
}

export function selectTenantScopeParams(
  state: { tenant: TenantState },
  role: "admin" | "cashier" = "admin",
): { businessId?: string; locationId?: string } {
  if (role === "cashier") return {};
  return {
    businessId: state.tenant.selectedBusiness?.id,
    locationId: state.tenant.selectedBranch?.id,
  };
}
