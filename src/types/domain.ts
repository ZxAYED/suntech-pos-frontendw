export type UserRole = "SUPER_ADMIN" | "ADMIN" | "CASHIER";
export type LoginType = "ADMIN" | "BUSINESS_USER";
export type AccountStatus = "ACTIVE" | "SUSPENDED" | "INACTIVE" | "PENDING_APPROVAL";
export type OperationalStatus = "ACTIVE" | "INACTIVE";
export type ShiftStatus = "OPEN" | "CLOSED";
export type OrderStatus = "PENDING" | "PAID" | "REFUNDED" | "PARTIALLY_REFUNDED";
export type OrderType = "CATALOG" | "CUSTOM";
export type PaymentMethod = "COD" | "BKASH" | "NAGAD" | "BANK";

export interface User {
  id: string;
  role: UserRole;
  fullName: string;
  displayName?: string;
  email?: string | null;
  phoneNumber?: string | null;
  publicId?: string | null;
  businessId?: string | null;
  locationId?: string | null;
  locationName?: string | null;
  profileImageUrl?: string | null;
  status: AccountStatus;
}

export interface AuthSession {
  user: User;
}

export interface Business {
  id: string;
  name: string;
  code?: string | null;
  status: OperationalStatus;
  profileImageUrl?: string | null;
  locations?: Location[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Location {
  id: string;
  businessId: string;
  name: string;
  address?: string | null;
  code?: string | null;
  status: OperationalStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  isActive: boolean;
  status?: OperationalStatus;
  productsCount?: number;
  activeSkus?: number;
  totalUnits?: number;
  inventoryValue?: number;
  sortOrder?: number;
}

export interface CustomAttribute {
  key: string;
  value: unknown;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string | null;
  description?: string | null;
  customAttributes?: CustomAttribute[] | Record<string, unknown> | null;
  brand?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  category?: Category | null;
  variants?: Variant[];
}

export interface VariantImage {
  id: string;
  url: string;
  publicId?: string | null;
  key?: string | null;
  sortOrder?: number;
  createdAt?: string;
}

export interface Variant {
  id: string;
  productId: string;
  name?: string | null;
  sku: string;
  barcode?: string | null;
  sellingPrice: number;
  stock: number;
  isActive: boolean;
  costPrice?: number | null;
  minimumStock?: number | null;
  profileImageUrl?: string | null;
  profileImagePublicId?: string | null;
  profileImageKey?: string | null;
  images?: VariantImage[];
  productName?: string;
  categoryId?: string | null;
  categoryName?: string;
  product?: Product;
}

export interface Shift {
  id: string;
  status: ShiftStatus;
  locationId: string;
  cashierId: string;
  cashierName?: string;
  openingFloat: number;
  openedAt: string;
  closedAt?: string | null;
  expectedCash?: number | null;
  closingCash?: number | null;
  variance?: number | null;
}

export interface OrderLine {
  id: string;
  orderId?: string;
  variantId?: string | null;
  productName: string;
  variantName?: string | null;
  sku?: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  invoiceNumber: string;
  type: OrderType;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  businessId: string;
  locationId: string;
  shiftId?: string | null;
  cashierId?: string | null;
  cashierName?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  lines: OrderLine[];
  subtotal: number;
  totalAmount: number;
  tenderedAmount?: number | null;
  changeDue?: number | null;
  refundedAmount?: number;
  createdAt: string;
}

export interface RefundItemInput {
  orderItemId: string;
  quantity: number;
}

export interface Refund {
  id: string;
  orderId: string;
  reason?: string | null;
  items: RefundItemInput[];
  totalAmount: number;
  createdAt: string;
}

export interface Cashier {
  id: string;
  fullName: string;
  publicId: string;
  email?: string | null;
  phoneNumber?: string | null;
  locationId: string;
  locationName?: string | null;
  monthlySalary?: number | null;
  status: AccountStatus;
  createdAt?: string;
}

export interface Advance {
  id: string;
  cashierId: string;
  cashierName?: string | null;
  amount: number;
  note?: string | null;
  createdAt: string;
  status?: "ACTIVE" | "VOIDED" | "SETTLED";
}

export interface PayrollRecord {
  id: string;
  cashierId: string;
  cashierName: string;
  cashierPublicId?: string | null;
  month: number;
  year: number;
  baseSalary: number;
  advancesTotal: number;
  netPayable: number;
  processed: boolean;
  disbursedAt?: string | null;
}

export interface DashboardSummary {
  grossSales: number;
  averageTicket: number;
  orderCount: number;
  grossMargin?: number;
  paymentBreakdown: Array<{ method: PaymentMethod; amount: number; percentage: number }>;
}

export interface CategoryMetric {
  categoryId: string;
  categoryName: string;
  revenue: number;
  quantity: number;
  percentage: number;
}

export interface DateRangeParams {
  from?: string;
  to?: string;
}

export interface PaginationState {
  page: number;
  limit: number;
}
