import {
  TENANT_SET_BUSINESS,
  TENANT_SET_BRANCH,
  TENANT_SET_SELECTION,
  TENANT_HYDRATE,
  type TenantAction,
  type TenantState,
  type BusinessItem,
} from "@/redux/types";

export const TENANT_STORAGE_KEY = "suntech_active_tenant";

export const DEFAULT_BUSINESSES: BusinessItem[] = [
  {
    id: "biz-suntech-elec",
    name: "SunTech Electronics Ltd",
    code: "ST-ELEC",
    plan: "Enterprise",
    branches: [
      {
        id: "loc-doyel",
        businessId: "biz-suntech-elec",
        name: "Uttara Doyel Branch (Lane 01)",
        code: "DOYEL-01",
        address: "House 12, Road 4, Sector 3, Uttara, Dhaka",
        laneCount: 4,
        isMain: true,
        status: "ACTIVE",
      },
      {
        id: "loc-bashundhara",
        businessId: "biz-suntech-elec",
        name: "Bashundhara City Branch",
        code: "BSH-02",
        address: "Level 5, Block B, Bashundhara City Mall, Panthapath, Dhaka",
        laneCount: 3,
        isMain: false,
        status: "ACTIVE",
      },
      {
        id: "loc-jamuna",
        businessId: "biz-suntech-elec",
        name: "Jamuna Future Park Branch",
        code: "JFP-03",
        address: "Level 4, Zone C, Jamuna Future Park, Kuril, Dhaka",
        laneCount: 2,
        isMain: false,
        status: "ACTIVE",
      },
    ],
  },
  {
    id: "biz-gadget-hub",
    name: "SunTech Gadget Hub",
    code: "ST-HUB",
    plan: "Pro",
    branches: [
      {
        id: "loc-dhanmondi",
        businessId: "biz-gadget-hub",
        name: "Dhanmondi 27 Hub",
        code: "DHM-01",
        address: "Rangs Fortune Square, Dhanmondi 27, Dhaka",
        laneCount: 2,
        isMain: true,
        status: "ACTIVE",
      },
      {
        id: "loc-gulshan",
        businessId: "biz-gadget-hub",
        name: "Gulshan 1 Flagship",
        code: "GUL-02",
        address: "Navana Tower, Gulshan 1, Dhaka",
        laneCount: 3,
        isMain: false,
        status: "ACTIVE",
      },
    ],
  },
  {
    id: "biz-apex",
    name: "Apex Retail Partners",
    code: "APX-RETAIL",
    plan: "Growth",
    branches: [
      {
        id: "loc-mirpur",
        businessId: "biz-apex",
        name: "Mirpur 10 Express",
        code: "MRP-01",
        address: "Mirpur 10 Circle, Section 10, Dhaka",
        laneCount: 1,
        isMain: true,
        status: "ACTIVE",
      },
    ],
  },
];

function persistTenant(business: unknown, branch: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      TENANT_STORAGE_KEY,
      JSON.stringify({ business, branch }),
    );
  } catch (err) {
    console.error("[TenantReducer] Failed to persist tenant selection", err);
  }
}

function getInitialTenant(): {
  selectedBusiness: BusinessItem;
  selectedBranch: BusinessItem["branches"][0];
} {
  const defaultBiz = DEFAULT_BUSINESSES[0];
  const defaultBranch = defaultBiz.branches[0];

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(TENANT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.business?.id && parsed?.branch?.id) {
          const matchedBiz =
            DEFAULT_BUSINESSES.find((b) => b.id === parsed.business.id) ||
            parsed.business;
          const matchedBranch =
            matchedBiz.branches.find(
              (br: { id: string }) => br.id === parsed.branch.id,
            ) || parsed.branch;
          return {
            selectedBusiness: matchedBiz,
            selectedBranch: matchedBranch,
          };
        }
      }
    } catch {
      // fallback to defaults
    }
  }

  return { selectedBusiness: defaultBiz, selectedBranch: defaultBranch };
}

const initial = getInitialTenant();

const initialState: TenantState = {
  selectedBusiness: initial.selectedBusiness,
  selectedBranch: initial.selectedBranch,
  availableBusinesses: DEFAULT_BUSINESSES,
  hydrated: false,
};

export function tenantReducer(
  state: TenantState = initialState,
  action: TenantAction,
): TenantState {
  switch (action.type) {
    case TENANT_SET_BUSINESS: {
      const nextBusiness = action.payload;
      const isCurrentBranchInBusiness = nextBusiness.branches.some(
        (b) => b.id === state.selectedBranch?.id,
      );
      const nextBranch = isCurrentBranchInBusiness
        ? state.selectedBranch!
        : nextBusiness.branches.find((b) => b.isMain) || nextBusiness.branches[0];

      persistTenant(nextBusiness, nextBranch);
      return {
        ...state,
        selectedBusiness: nextBusiness,
        selectedBranch: nextBranch,
      };
    }

    case TENANT_SET_BRANCH: {
      const nextBranch = action.payload;
      persistTenant(state.selectedBusiness, nextBranch);
      return {
        ...state,
        selectedBranch: nextBranch,
      };
    }

    case TENANT_SET_SELECTION: {
      const { business, branch } = action.payload;
      persistTenant(business, branch);
      return {
        ...state,
        selectedBusiness: business,
        selectedBranch: branch,
        hydrated: true,
      };
    }

    case TENANT_HYDRATE: {
      if (!action.payload) {
        return { ...state, hydrated: true };
      }
      return {
        ...state,
        selectedBusiness: action.payload.business,
        selectedBranch: action.payload.branch,
        hydrated: true,
      };
    }

    default:
      return state;
  }
}
