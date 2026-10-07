export const queryKeys = {
  auth: { me: ["auth", "me"] as const },
  shifts: { active: ["shifts", "active"] as const },
  catalog: {
    categories: ["catalog", "categories"] as const,
    products: (params?: Record<string, unknown>) =>
      ["catalog", "products", params] as const,
    variants: (productId: string) => ["catalog", "variants", productId] as const,
  },
  orders: {
    list: (params?: Record<string, unknown>) =>
      ["orders", "list", params] as const,
  },
  payroll: {
    summary: (cashierId: string, month: number, year: number) =>
      ["payroll", "summary", { cashierId, month, year }] as const,
    history: (month: number, year: number) =>
      ["payroll", "history", { month, year }] as const,
    advances: (cashierId: string, month: number, year: number) =>
      ["payroll", "advances", { cashierId, month, year }] as const,
  },
  staff: {
    cashiers: ["staff", "cashiers"] as const,
  },
  reports: {
    dashboard: (role: string) => ["reports", "dashboard", role] as const,
    transactions: (params?: Record<string, unknown>) =>
      ["reports", "transactions", params] as const,
  },
};
