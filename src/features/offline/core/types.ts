import type { Category, Order, PaymentMethod, Product, User, Variant } from "@/types/domain";

export interface OfflineScope { userId: string; businessId: string; locationId: string; deviceId: string }
export type PricePolicy = "CURRENT_PRICE" | "CAPTURED_PRICE";
export type SaleType = "CATALOG" | "CUSTOM";
export type OutboxState = "PENDING" | "SENDING" | "UNKNOWN" | "RETRY_WAIT" | "BLOCKED_AUTH" | "NEEDS_REVIEW" | "SYNCED";
export interface SaleLine {
  variantId?: string; productName?: string; variantName?: string; sku?: string;
  quantity: number; unitPrice: number;
}
export interface WireSale {
  clientOrderId: string; userId: string; orderType: SaleType; occurredAt: string;
  shiftId: string | null; paymentMethod: PaymentMethod; tenderedAmount: number;
  lines: Array<{ variantId?: string; productName?: string; variantName?: string; quantity: number; unitPrice: number }>;
  customerName?: string; customerPhone?: string; notes?: string;
  clientReceiptNumber: string; pricePolicy: PricePolicy; grantToken: string;
}
export interface LocalSale {
  clientOrderId: string; scopeKey: string; scope: OfflineScope; payloadHash: string;
  wire: WireSale; lines: SaleLine[]; totalAmount: number; changeDue: number;
  occurredAt: string; savedAt: string; cartFinalizationKey: string;
  businessName?: string; locationName?: string; cashierName?: string;
  paymentEvidence: "RECEIVED_REPORTED";
}
export interface LocalReceipt {
  clientOrderId: string; scopeKey: string; order: Order;
  label: "Saved on device — server confirmation pending";
}
export interface OutboxRecord {
  clientOrderId: string; scopeKey: string; state: OutboxState;
  nextAttemptAt: number; attempts: number; fence?: number;
  lastCode?: string; lastMessage?: string; updatedAt: string;
}
export interface StockOverlay {
  key: string; scopeKey: string; clientOrderId: string; variantId: string; quantityDelta: number;
}
export interface CartRecord {
  key: string; scopeKey: string; kind: SaleType; state: "ACTIVE" | "HELD" | "COMPLETED";
  revision: number; data: Record<string, unknown>; updatedAt: string;
  finalizedBy?: string; label?: string;
}
export interface ServerMapping {
  clientOrderId: string; scopeKey: string; orderId: string; invoiceNumber: string;
  order: Order; acknowledgedAt: string; warnings: string[];
}
export interface GrantClaims {
  version: 1; iss: "suntech-pos"; aud: "suntech-offline"; jti: string;
  sub: string; userId: string; businessId: string; locationId: string; deviceId: string;
  role: User["role"]; iat: number; exp: number;
  permissions: Array<"CATALOG_SALE" | "CUSTOM_SALE" | "REFUND_PAYOUT_EVIDENCE" | "PRODUCT_DESCRIPTION_EDIT">;
  offlineIntakeAllowed: boolean; capturedPriceAllowed: boolean;
}
export interface VerificationKey { kid: string; jwk: JsonWebKey }
export interface OfflinePermission {
  scopeKey: string; scope: OfflineScope; grantToken: string; verificationKey: VerificationKey;
  user: User; installedAt: string; lastObservedAt: number; provisionRequestStartedAt?: number;
  unlock?: { salt: string; hash: string; iterations: number };
  failedUnlocks?: number; unlockRetryAt?: number;
  rejectedAt?: number; rejectedReason?: string;
}
export interface CatalogSnapshot {
  scopeKey: string; snapshotId: string; savedAt: string; serverTime: string;
  categories: Category[]; products: Product[]; variants: Variant[];
  business: { id: string; name: string }; location: { id: string; name: string; businessId?: string };
  history: Order[]; historyComplete: false;
  acceptedClientOrderIds: string[];
}
export interface SyncLease { key: string; owner: string; fence: number; expiresAt: number }
export interface MetaRecord { key: string; value: unknown }
export interface ReviewRecord { clientOrderId: string; scopeKey: string; code: string; message: string; recordedAt: string }
export interface BootstrapCategory extends Category { products: Array<Omit<Product, "variants"> & { variants: Variant[] }> }
export interface BootstrapPayload {
  serverTime: string; snapshotGeneratedAt?: string;
  manifest: { version: 2; snapshotId: string; complete: true;
    counts: { categories: number; products: number; variants: number };
    scope: { userId: string; businessId: string; locationId: string; deviceId?: string };
    history: { complete: false; limit: number }; acceptedIdsComplete?: boolean;
  };
  user: User; business: { id: string; name: string }; location: { id: string; name: string; businessId?: string };
  categories: BootstrapCategory[]; history?: Order[]; acceptedClientOrderIds: string[];
  acceptedIdsComplete?: boolean;
}
export interface ProvisioningResponse {
  grantToken: string; claims: GrantClaims; verificationKey: VerificationKey; bootstrap: BootstrapPayload;
}
export interface SyncResult {
  clientOrderId: string; status: "ACCEPTED" | "DUPLICATE" | "REJECTED";
  code?: string; retryable: boolean; message?: string; error?: string; order?: Order & { orderType?: SaleType; clientOrderId?: string };
  orderId?: string; invoiceNumber?: string; warnings?: string[];
}
export interface SyncEnvelope {
  deviceId: string; businessId: string; locationId: string; orders: WireSale[];
}
