import type { OfflineDatabase } from "@/features/offline/db/offline-db";
import { OfflineError } from "@/features/offline/core/scope";

/** A storage read error is not proof that a local financial transaction failed. */
export async function localCommitStatus(db: OfflineDatabase, clientOrderId: string, error?: unknown): Promise<"SAVED" | "NOT_SAVED" | "UNKNOWN"> {
  try {
    if (await db.localSales.get(clientOrderId)) return "SAVED";
    if (error instanceof OfflineError && ["SALE_ID_CONFLICT", "RECEIPT_MISSING", "CART_ALREADY_COMPLETED", "CART_FINALIZED"].includes(error.code)) return "UNKNOWN";
    return "NOT_SAVED";
  } catch { return "UNKNOWN"; }
}
