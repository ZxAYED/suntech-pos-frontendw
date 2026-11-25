/** Version 1 wire contract. Keep the backend copy byte-identical. No platform dependencies. */
export interface AdvancedScope { userId: string; businessId: string; locationId: string; deviceId: string }
export type AdvancedKind = "REFUND_PAYOUT_EVIDENCE" | "PRODUCT_DESCRIPTION_EDIT";
interface CommonCommand { version: 1; clientCommandId: string; scope: AdvancedScope; occurredAt: string; grantToken: string }
export interface RefundCommand extends CommonCommand {
  kind: "REFUND_PAYOUT_EVIDENCE";
  orderId: string; items: Array<{ orderItemId: string; quantity: number; unitPrice: number }>;
  totalRefund: number; reason: string; payoutShiftId: string | null;
  paymentMethod: "COD" | "BKASH" | "NAGAD" | "BANK";
  evidence: "REPORTED_ALREADY_PAID";
}
export interface DescriptionCommand extends CommonCommand {
  kind: "PRODUCT_DESCRIPTION_EDIT"; productId: string; expectedUpdatedAt: string;
  expectedDescription: string | null; description: string | null;
}
export type AdvancedCommand = RefundCommand | DescriptionCommand;
export interface AdvancedAck {
  clientCommandId: string; kind: AdvancedKind; payloadHash: string;
  status: "ACCEPTED" | "DUPLICATE"; postedAt: string;
  result: { entityId: string; refundId?: string; totalRefund?: number; updatedAt?: string };
}
const INT_MAX = 2147483647;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail = (message: string): never => { throw new Error(message); };
function object(value: unknown, fields: string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("Expected a command object.");
  const row = value as Record<string, unknown>;
  if (Object.keys(row).length !== fields.length || fields.some(key => !Object.prototype.hasOwnProperty.call(row, key))) fail("Missing or unexpected command field.");
  return row;
}
function text(value: unknown, max: number, allowEmpty = false): string {
  if (typeof value !== "string" || value.length > max || (!allowEmpty && !value.trim())) return fail("Invalid command text or identity.");
  return value;
}
function money(value: unknown, min = 0): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > INT_MAX) return fail("Invalid whole-BDT amount or quantity.");
  return value;
}
function instant(value: unknown): string {
  const s = text(value, 24);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(s) || !Number.isFinite(Date.parse(s)) || new Date(s).toISOString() !== s) return fail("Use a valid original UTC timestamp.");
  return s;
}
export function parseAdvancedCommand(value: unknown): AdvancedCommand {
  const kind = (value as { kind?: unknown } | null)?.kind;
  const base = ["version", "clientCommandId", "scope", "occurredAt", "grantToken", "kind"];
  const extra = kind === "REFUND_PAYOUT_EVIDENCE" ? ["orderId", "items", "totalRefund", "reason", "payoutShiftId", "paymentMethod", "evidence"] : kind === "PRODUCT_DESCRIPTION_EDIT" ? ["productId", "expectedUpdatedAt", "expectedDescription", "description"] : fail("Unsupported command kind.");
  const row = object(value, [...base, ...extra]);
  if (row.version !== 1 || !uuid.test(text(row.clientCommandId, 36))) fail("Invalid command identity or version.");
  const scope = object(row.scope, ["userId", "businessId", "locationId", "deviceId"]);
  for (const field of ["userId", "businessId", "locationId"]) text(scope[field], 64);
  if (!uuid.test(text(scope.deviceId, 36))) fail("Invalid original device identity.");
  instant(row.occurredAt); text(row.grantToken, 16000);
  if (kind === "REFUND_PAYOUT_EVIDENCE") {
    text(row.orderId, 64); text(row.reason, 500); if (row.payoutShiftId !== null) text(row.payoutShiftId, 64);
    if (!["COD", "BKASH", "NAGAD", "BANK"].includes(row.paymentMethod as string) || row.evidence !== "REPORTED_ALREADY_PAID") fail("Explicit payout evidence and original payment method are required.");
    if (!Array.isArray(row.items) || !row.items.length) return fail("At least one original order line is required.");
    const ids = new Set<string>(); let total = 0;
    for (const value of row.items) {
      const item = object(value, ["orderItemId", "quantity", "unitPrice"]);
      const id = text(item.orderItemId, 64);
      if (ids.has(id)) fail("Duplicate original line identity.");
      ids.add(id);
      total += money(item.quantity, 1) * money(item.unitPrice);
      money(total);
    }
    if (money(row.totalRefund, 1) !== total) fail("Reported payout differs from the selected original lines.");
  } else {
    text(row.productId, 64); instant(row.expectedUpdatedAt);
    if (row.expectedDescription !== null) text(row.expectedDescription, 500, true);
    if (row.description !== null) text(row.description, 500, true);
    if (row.description === row.expectedDescription) fail("The description has not changed.");
  }
  return value as AdvancedCommand;
}
export function commandEntity(command: AdvancedCommand): string {
  return command.kind === "REFUND_PAYOUT_EVIDENCE" ? command.orderId : command.productId;
}
/** Read-only ack validation; transport errors and malformed results must never mark a command complete. */
export function matchesAdvancedAck(value: unknown, command: AdvancedCommand, hash: string): value is AdvancedAck {
  const ack = value as AdvancedAck | null;
  if (!ack || ack.clientCommandId !== command.clientCommandId || ack.kind !== command.kind || ack.payloadHash !== hash || !["ACCEPTED", "DUPLICATE"].includes(ack.status) || !ack.result || ack.result.entityId !== commandEntity(command)) return false;
  try { instant(ack.postedAt); } catch { return false; }
  if (command.kind === "REFUND_PAYOUT_EVIDENCE") return typeof ack.result.refundId === "string" && !!ack.result.refundId && ack.result.totalRefund === command.totalRefund;
  try { return Date.parse(instant(ack.result.updatedAt)) >= Date.parse(command.expectedUpdatedAt); } catch { return false; }
}
