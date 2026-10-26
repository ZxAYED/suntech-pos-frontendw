import {
  TENANT_HYDRATE,
  TENANT_SET_AVAILABLE_BUSINESSES,
  TENANT_SET_BRANCH,
  TENANT_SET_BUSINESS,
  TENANT_SET_SELECTION,
  type TenantAction,
  type TenantState,
} from "@/redux/types";

const initialState: TenantState = {
  selectedBusiness: null,
  selectedBranch: null,
  availableBusinesses: [],
  hydrated: false,
};

export function tenantReducer(
  state: TenantState = initialState,
  action: TenantAction,
): TenantState {
  switch (action.type) {
    case TENANT_SET_AVAILABLE_BUSINESSES:
      return { ...state, availableBusinesses: action.payload };
    case TENANT_SET_BUSINESS: {
      const business = action.payload;
      const selectedBranch =
        business?.branches.find((branch) => branch.id === state.selectedBranch?.id) ?? null;
      return { ...state, selectedBusiness: business, selectedBranch };
    }
    case TENANT_SET_BRANCH:
      return { ...state, selectedBranch: action.payload };
    case TENANT_SET_SELECTION:
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
