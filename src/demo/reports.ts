export interface DemoSalesSummary {
  todayRevenue: number;
  todayOrders: number;
  averageTicketValue: number;
  grossMarginPercent: number;
  cashPercentage: number;
  digitalPercentage: number;
  topCategories: Array<{ name: string; revenue: number; percentage: number }>;
}

export const demoSalesSummary: DemoSalesSummary = {
  todayRevenue: 148200,
  todayOrders: 94,
  averageTicketValue: 1576,
  grossMarginPercent: 24.2,
  cashPercentage: 62,
  digitalPercentage: 38,
  topCategories: [
    { name: "Smartphones", revenue: 84997, percentage: 57.3 },
    { name: "Chargers & Adapters", revenue: 26500, percentage: 17.9 },
    { name: "Earbuds & Audio", revenue: 19850, percentage: 13.4 },
    { name: "Cables & Connectors", revenue: 11250, percentage: 7.6 },
    { name: "Screen Protectors", revenue: 5603, percentage: 3.8 },
  ],
};
