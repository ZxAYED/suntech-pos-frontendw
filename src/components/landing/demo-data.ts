export type BranchId = "uttara" | "mirpur";

export type BranchPreview = {
  id: BranchId;
  label: string;
  revenueToday: number;
  orderCount: number;
  lowStockCount: number;
  bars: readonly number[];
  inventory: readonly {
    sku: string;
    name: string;
    stock: number;
    sellingPrice: number;
  }[];
  activity: readonly {
    id: string;
    label: string;
    amount: number;
    direction: "IN" | "OUT";
  }[];
};

export const BRANCH_PREVIEWS: Record<BranchId, BranchPreview> = {
  uttara: {
    id: "uttara",
    label: "Uttara",
    revenueToday: 128450,
    orderCount: 48,
    lowStockCount: 2,
    bars: [25, 39, 32, 61, 47, 76, 58, 81, 72],
    inventory: [
      { sku: "CHG-45W", name: "45W Fast Charger", stock: 22, sellingPrice: 1450 },
      { sku: "BUDS-TWS", name: "TWS Earbuds", stock: 4, sellingPrice: 2490 },
    ],
    activity: [
      { id: "u-1", label: "Catalog sale", amount: 5490, direction: "IN" },
      { id: "u-2", label: "Shop expense", amount: 850, direction: "OUT" },
    ],
  },
  mirpur: {
    id: "mirpur",
    label: "Mirpur",
    revenueToday: 97320,
    orderCount: 36,
    lowStockCount: 1,
    bars: [35, 28, 54, 43, 62, 48, 73, 57, 69],
    inventory: [
      { sku: "CHG-45W", name: "45W Fast Charger", stock: 9, sellingPrice: 1390 },
      { sku: "BUDS-TWS", name: "TWS Earbuds", stock: 18, sellingPrice: 2590 },
    ],
    activity: [
      { id: "m-1", label: "Catalog sale", amount: 4380, direction: "IN" },
      { id: "m-2", label: "Staff advance", amount: 1200, direction: "OUT" },
    ],
  },
};

export const formatBDT = (value: number) =>
  `৳${new Intl.NumberFormat("en-BD").format(value)}`;
