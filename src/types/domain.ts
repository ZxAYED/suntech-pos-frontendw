export type UserRole = "SUPER_ADMIN" | "ADMIN" | "CASHIER";
export type LoginType = "ADMIN" | "BUSINESS_USER";
export type AccountStatus = "ACTIVE" | "SUSPENDED";
export type ShiftStatus = "OPEN" | "CLOSED";
export type OrderStatus = "PAID" | "PENDING" | "REFUNDED";

export interface User {
  id: string;
  role: UserRole;
  email?: string | null;
  publicId?: string | null;
  displayName: string;
  businessId?: string | null;
  locationId?: string | null;
  locationName?: string | null;
  status?: AccountStatus;
}

export interface AuthSession {
  accessToken: string;
  user: User;
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string;
}

export interface Variant {
  id: string;
  productId: string;
  productName?: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  isActive: boolean;
}

export interface Shift {
  id: string;
  status: ShiftStatus;
  locationId: string;
  cashierId: string;
  startingAmount: number;
  closingAmount?: number | null;
  openedAt: string;
  closedAt?: string | null;
}

export interface OrderLine {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  variantId?: string | null;
}

export interface Order {
  id: string;
  status: OrderStatus;
  locationId: string;
  shiftId: string;
  cashierId: string;
  lines: OrderLine[];
  subtotal: number;
  totalAmount: number;
  tenderedAmount: number;
  changeDue: number;
  createdAt: string;
}

export interface CashierAccount {
  id: string;
  publicId: string;
  displayName: string;
  status: AccountStatus;
  locationId: string;
  locationName?: string;
  monthlySalary?: number | null;
}

export interface AdvanceEntry {
  id: string;
  cashierId: string;
  amount: number;
  note?: string;
  createdAt: string;
}

export interface PayrollSummary {
  cashierId: string;
  cashierName: string;
  month: number;
  year: number;
  monthlySalary: number;
  advancesTotal: number;
  netPayable: number;
  processed: boolean;
}

export interface DashboardMetrics {
  dailyRevenue: number;
  volume30d: number;
  orderCountToday: number;
  staffLeaderboard: Array<{
    cashierId: string;
    cashierName: string;
    totalAmount: number;
  }>;
}

export interface DateRangeParams {
  from?: string;
  to?: string;
}
