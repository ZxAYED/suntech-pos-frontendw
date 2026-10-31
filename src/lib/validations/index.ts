import { z } from "zod";

// ==========================================
// 1. Core Financial & Type Primitives
// ==========================================
export const safeIntegerBDTSchema = z
  .number()
  .int("Amount must be a whole integer BDT taka")
  .min(0, "Amount cannot be negative")
  .refine((val) => Number.isSafeInteger(val), "Amount exceeds safe numeric limits");

export const positiveIntegerBDTSchema = z
  .number()
  .int("Amount must be a whole integer BDT taka")
  .positive("Amount must be greater than zero")
  .refine((val) => Number.isSafeInteger(val), "Amount exceeds safe numeric limits");

export const paymentMethodSchema = z.enum(["COD", "BKASH", "NAGAD", "BANK"], {
  message: "Invalid payment method. Must be COD, BKASH, NAGAD, or BANK",
});

export const idempotencyKeySchema = z
  .string()
  .uuid("Idempotency key must be a valid UUIDv4");

// ==========================================
// 2. Authentication Validation Schemas
// ==========================================
export const adminLoginSchema = z.object({
  loginType: z.literal("ADMIN"),
  email: z.string().email("Please enter a valid email address").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const cashierLoginSchema = z.object({
  loginType: z.literal("BUSINESS_USER"),
  publicId: z.string().min(1, "Public ID is required").trim().toUpperCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const unifiedLoginSchema = z.discriminatedUnion("loginType", [
  adminLoginSchema,
  cashierLoginSchema,
]);

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email or Cashier ID is required")
    .trim(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(120).trim(),
  email: z.string().email("Valid business email is required").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must not exceed 72 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
      "Password must include uppercase, lowercase, number, and special character",
    ),
  phoneNumber: z.string().min(8, "Phone number must be at least 8 digits").max(20).optional().or(z.literal("")),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email is required").trim().toLowerCase(),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().email("Valid email is required").trim().toLowerCase(),
  otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must be numeric"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ==========================================
// 3. Catalog Validation Schemas
// ==========================================
export const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required").max(100).trim(),
  description: z.string().max(500).optional().or(z.literal("")),
  businessId: z.string().uuid().optional(),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;

export const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required").max(120).trim(),
  description: z.string().max(1000).optional().or(z.literal("")),
  categoryId: z.string({ required_error: "Category is required" }).uuid("Please select a valid category"),
  businessId: z.string().uuid().optional(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;

export const variantFormSchema = z.object({
  name: z.string().min(1, "Variant name is required").max(100).trim(),
  sku: z.string().max(64).optional().or(z.literal("")),
  barcode: z.string().max(64).nullable().optional().or(z.literal("")),
  sellingPrice: positiveIntegerBDTSchema,
  costPrice: safeIntegerBDTSchema.nullable().optional(),
  stock: safeIntegerBDTSchema.default(0),
  productId: z.string().uuid().optional(),
  businessId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
});

export type VariantFormData = z.infer<typeof variantFormSchema>;

export const adjustStockSchema = z.object({
  stock: safeIntegerBDTSchema,
  operation: z.enum(["set", "add", "deduct"]).default("set"),
  locationId: z.string().uuid().optional(),
  businessId: z.string().uuid().optional(),
});

export type AdjustStockInput = z.infer<typeof adjustStockSchema>;

// ==========================================
// 4. POS Orders & Checkout Schemas
// ==========================================
export const catalogOrderLineSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: safeIntegerBDTSchema,
});

export const catalogCheckoutSchema = z.object({
  lines: z.array(catalogOrderLineSchema).min(1, "Cart cannot be empty"),
  tenderedAmount: safeIntegerBDTSchema,
  paymentMethod: paymentMethodSchema.default("COD"),
  customerName: z.string().max(120).optional().or(z.literal("")),
  customerPhone: z.string().max(20).optional().or(z.literal("")),
  shiftId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  businessId: z.string().uuid().optional(),
  idempotencyKey: idempotencyKeySchema,
}).refine(
  (data) => {
    if (data.paymentMethod === "COD") {
      const total = data.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
      return data.tenderedAmount >= total;
    }
    return true;
  },
  {
    message: "Tendered cash must be at least equal to order total",
    path: ["tenderedAmount"],
  }
);

export type CatalogCheckoutInput = z.infer<typeof catalogCheckoutSchema>;

export const customOrderItemSchema = z.object({
  productName: z.string().min(1, "Product name is required").max(120).trim(),
  variantName: z.string().max(120).trim().optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: safeIntegerBDTSchema,
});

export const customOrderSchema = z.object({
  lines: z.array(customOrderItemSchema).min(1, "At least one item line is required"),
  tenderedAmount: safeIntegerBDTSchema,
  paymentMethod: paymentMethodSchema.default("COD"),
  customerName: z.string().max(120).optional().or(z.literal("")),
  customerPhone: z.string().max(20).optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
  shiftId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  businessId: z.string().uuid().optional(),
  idempotencyKey: idempotencyKeySchema,
}).refine(
  (data) => {
    if (data.paymentMethod === "COD") {
      const total = data.lines.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      return data.tenderedAmount >= total;
    }
    return true;
  },
  {
    message: "Tendered cash must be at least equal to order total",
    path: ["tenderedAmount"],
  }
);

export type CustomOrderInput = z.infer<typeof customOrderSchema>;

export const refundLineSchema = z.object({
  orderItemId: z.string().min(1, "Order item ID is required"),
  quantity: z.number().int().min(1, "Refund quantity must be at least 1"),
});

export const createRefundSchema = z.object({
  items: z.array(refundLineSchema).min(1, "At least one item must be selected for refund"),
  reason: z.string().max(500).optional().or(z.literal("")),
  idempotencyKey: idempotencyKeySchema,
});

export type CreateRefundInput = z.infer<typeof createRefundSchema>;

// ==========================================
// 5. Shift Management Schemas
// ==========================================
export const openShiftSchema = z.object({
  startingAmount: safeIntegerBDTSchema,
  locationId: z.string().uuid().optional(),
  autoClosePrevious: z.boolean().optional(),
  idempotencyKey: idempotencyKeySchema,
});

export type OpenShiftInput = z.infer<typeof openShiftSchema>;

export const closeShiftSchema = z.object({
  closingAmount: safeIntegerBDTSchema,
  notes: z.string().max(500).optional().or(z.literal("")),
  idempotencyKey: idempotencyKeySchema,
});

export type CloseShiftInput = z.infer<typeof closeShiftSchema>;

// ==========================================
// 6. HR, Staff, Advances & Payroll Schemas
// ==========================================
export const createCashierSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(120).trim(),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  phoneNumber: z.string().min(8, "Phone must be at least 8 digits").max(20).optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  locationId: z.string().min(1, "Assigned branch location is required"),
  monthlySalary: positiveIntegerBDTSchema,
  businessId: z.string().uuid().optional(),
});

export type CreateCashierFormData = z.infer<typeof createCashierSchema>;

export const updateCashierSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(1).max(120).trim().optional(),
  phoneNumber: z.string().min(8).max(20).optional().or(z.literal("")),
  locationId: z.string().optional(),
  monthlySalary: positiveIntegerBDTSchema.optional(),
  password: z.string().min(8, "Password must be at least 8 characters").max(72).optional(),
  businessId: z.string().uuid().optional(),
});

export type UpdateCashierFormData = z.infer<typeof updateCashierSchema>;

export const createAdvanceSchema = z.object({
  amount: positiveIntegerBDTSchema,
  reason: z.string().max(255).optional().or(z.literal("")),
  idempotencyKey: idempotencyKeySchema,
});

export type CreateAdvanceFormData = z.infer<typeof createAdvanceSchema>;

export const processPayrollSchema = z.object({
  cashierId: z.string().min(1, "Cashier ID is required"),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
  idempotencyKey: idempotencyKeySchema,
});

export type ProcessPayrollInput = z.infer<typeof processPayrollSchema>;

export const disbursePayrollSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
  locationId: z.string().uuid().optional(),
  idempotencyKey: idempotencyKeySchema,
});

export type DisbursePayrollInput = z.infer<typeof disbursePayrollSchema>;

// ==========================================
// 7. Expenses Ledger Schemas
// ==========================================
export const expenseCategorySchema = z.enum([
  "RENT",
  "UTILITIES",
  "SALARIES",
  "SUPPLIES",
  "MAINTENANCE",
  "MARKETING",
  "TRANSPORT",
  "INVENTORY",
  "PERSONAL_DRAWING",
  "OTHER",
]);

export const createExpenseSchema = z.object({
  title: z.string().min(1, "Expense title is required").max(120).trim(),
  amount: positiveIntegerBDTSchema,
  category: expenseCategorySchema.default("OTHER"),
  note: z.string().max(500).optional().or(z.literal("")),
  spentAt: z.string().optional(),
  locationId: z.string().uuid().optional().nullable(),
  businessId: z.string().uuid().optional(),
});

export type CreateExpenseFormData = z.infer<typeof createExpenseSchema>;

// ==========================================
// 8. Tenant Management Schemas
// ==========================================
export const createBusinessSchema = z.object({
  name: z.string().min(1, "Business name is required").max(100).trim(),
  currency: z.string().default("BDT"),
});

export type CreateBusinessFormData = z.infer<typeof createBusinessSchema>;

export const createLocationSchema = z.object({
  name: z.string().min(1, "Branch name is required").max(100).trim(),
  address: z.string().min(1, "Address is required").max(255).trim(),
  businessId: z.string().uuid().optional(),
});

export type CreateLocationFormData = z.infer<typeof createLocationSchema>;
