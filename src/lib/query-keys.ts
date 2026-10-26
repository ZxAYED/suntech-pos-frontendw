export type QueryScope = Record<string, unknown> & {
  businessId?: string;
  locationId?: string;
};

export const queryKeys = {
  auth: { me: ["auth", "me"] as const },
  tenant: {
    businesses: ["tenant", "businesses"] as const,
    locations: (businessId?: string) => ["tenant", "locations", { businessId }] as const,
  },
  catalog: {
    categories: (scope?: QueryScope) => ["catalog", "categories", scope] as const,
    products: (scope?: QueryScope, filters?: Record<string, unknown>) => ["catalog", "products", scope, filters] as const,
    variants: (scope?: QueryScope, filters?: Record<string, unknown>) => ["catalog", "variants", scope, filters] as const,
  },
  orders: {
    list: (scope?: QueryScope, filters?: Record<string, unknown>) => ["orders", "list", scope, filters] as const,
    detail: (orderId: string) => ["orders", "detail", orderId] as const,
  },
  shifts: {
    active: (scope?: QueryScope) => ["shifts", "active", scope] as const,
    list: (scope?: QueryScope, filters?: Record<string, unknown>) => ["shifts", "list", scope, filters] as const,
  },
  staff: {
    list: (scope?: QueryScope, filters?: Record<string, unknown>) => ["staff", "list", scope, filters] as const,
  },
  payroll: {
    summary: (scope: QueryScope, period: { month: number; year: number }) => ["payroll", "summary", scope, period] as const,
    history: (scope: QueryScope, filters?: Record<string, unknown>) => ["payroll", "history", scope, filters] as const,
  },
  advances: {
    list: (scope: QueryScope, filters?: Record<string, unknown>) => ["advances", "list", scope, filters] as const,
  },
  reports: {
    dashboard: (scope: QueryScope, period?: string) => ["reports", "dashboard", scope, period] as const,
    analytics: (scope: QueryScope, period?: string) => ["reports", "analytics", scope, period] as const,
    transactions: (scope: QueryScope, filters?: Record<string, unknown>) => ["reports", "transactions", scope, filters] as const,
  },
};
