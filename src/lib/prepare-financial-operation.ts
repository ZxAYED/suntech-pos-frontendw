import { financialOperations, type FinancialDeliveryProtocol, type OperationScopeParams } from "@/lib/financial-operation";

const VALIDATION_ONLY_UUID = "00000000-0000-4000-8000-000000000000";

/** F02: validate before reserving a key. Preserve the existing payload format
 * for compatibility with recovery records created by older clients. */
export function prepareFinancialOperation<TPayload, TData extends { idempotencyKey: string }>(
  scope: OperationScopeParams,
  payload: TPayload,
  validate: (validationKey: string) => TData,
  deliveryProtocol: FinancialDeliveryProtocol = "LEGACY_HTTP",
) {
  const data = validate(VALIDATION_ONLY_UUID);
  const reservation = financialOperations.getOrCreateKey(scope, payload, deliveryProtocol);
  return { ...reservation, data: { ...data, idempotencyKey: reservation.key } };
}
