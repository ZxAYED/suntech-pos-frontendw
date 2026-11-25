import "fake-indexeddb/auto";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/types/api";

vi.mock("@/lib/api-client",()=>({apiClient:{post:vi.fn()}}));
vi.mock("../../db/offline-db",async importOriginal=>{
  const original=await importOriginal<typeof import("../../db/offline-db")>();
  return{...original,offlineDb:new original.OfflineDatabase(`checkout-adapter-${crypto.randomUUID()}`)};
});
import { apiClient } from "@/lib/api-client";
import { offlineDb } from "../../db/offline-db";
import { saveNewCheckout } from "../../services/checkout";
import { installProvisioning, lockOffline, setLocalUnlock } from "../grant";
import { checkoutInput, provisioning, scope } from "./fixtures";

beforeEach(async()=>{vi.clearAllMocks();lockOffline();await offlineDb.delete();await offlineDb.open();});
afterAll(async()=>{lockOffline();await offlineDb.delete();});
async function setup(){
  const response=await provisioning();await installProvisioning(offlineDb,response,scope);
  const core=await checkoutInput(offlineDb,response);
  return{response,input:{...core,idempotencyKey:core.clientOrderId}};
}
describe("existing checkout service uses the new durable writer",()=>{
  it("only performs a read-only online preflight before committing, never a legacy sale POST",async()=>{
    const{input}=await setup();const preflight=vi.mocked(apiClient.post);
    preflight.mockImplementation(async()=>{
      expect(await offlineDb.localSales.count()).toBe(0);expect(await offlineDb.receipts.count()).toBe(0);
      return{data:{valid:true}};
    });
    const order=await saveNewCheckout(input,scope,"CATALOG","ONLINE",async()=>{});
    expect(preflight).toHaveBeenCalledTimes(1);expect(preflight.mock.calls[0][0]).toBe("/orders/sync-v2/validate");
    expect(order.clientOrderId).toBe(input.idempotencyKey);expect(order.localStatus).toBe("PENDING");
    expect(await offlineDb.localSales.count()).toBe(1);expect(await offlineDb.receipts.count()).toBe(1);expect(await offlineDb.outbox.count()).toBe(1);
  });
  it("saves offline with the same writer and no network request",async()=>{
    const{input}=await setup();await setLocalUnlock(offlineDb,scope,"local-passphrase");
    await saveNewCheckout(input,scope,"CATALOG","OFFLINE",async()=>{throw new Error("must not renew offline");});
    expect(apiClient.post).not.toHaveBeenCalled();
    expect((await offlineDb.localSales.get(input.idempotencyKey))?.wire.pricePolicy).toBe("CAPTURED_PRICE");
  });
  it("preserves the immediate price-changed failure without creating a local paid event",async()=>{
    const{input}=await setup();vi.mocked(apiClient.post).mockRejectedValueOnce(new ApiClientError("Price changed",409,undefined,undefined,"PRICE_CHANGED"));
    await expect(saveNewCheckout(input,scope,"CATALOG","ONLINE",async()=>{})).rejects.toMatchObject({code:"PRICE_CHANGED"});
    expect(await offlineDb.localSales.count()).toBe(0);expect(await offlineDb.outbox.count()).toBe(0);expect((await offlineDb.drafts.get(input.cartKey))?.state).toBe("ACTIVE");
  });
  it("uses approved unlocked offline authority when Wi-Fi works but the backend is unavailable",async()=>{
    const{input}=await setup();await setLocalUnlock(offlineDb,scope,"offline-passphrase");
    vi.mocked(apiClient.post).mockRejectedValueOnce(new ApiClientError("Backend unavailable",503));
    const result=await saveNewCheckout(input,scope,"CATALOG","ONLINE",async()=>{throw new Error("Do not renew through an unavailable server");});
    expect(result.localStatus).toBe("PENDING");expect((await offlineDb.localSales.get(input.idempotencyKey))?.wire.pricePolicy).toBe("CAPTURED_PRICE");
    expect(vi.mocked(apiClient.post).mock.calls.map(call=>call[0])).toEqual(["/orders/sync-v2/validate"]);
  });
  it("does not treat a backend outage as permission to bypass local unlock",async()=>{
    const{input}=await setup();vi.mocked(apiClient.post).mockRejectedValueOnce(new ApiClientError("Backend unavailable",503));
    await expect(saveNewCheckout(input,scope,"CATALOG","ONLINE",async()=>{})).rejects.toMatchObject({code:"LOCAL_UNLOCK_REQUIRED"});
    expect(await offlineDb.localSales.count()).toBe(0);expect((await offlineDb.drafts.get(input.cartKey))?.state).toBe("ACTIVE");
  });
  it("does not downgrade a live authorization rejection into an offline sale",async()=>{
    const{input}=await setup();await setLocalUnlock(offlineDb,scope,"offline-passphrase");
    vi.mocked(apiClient.post).mockRejectedValueOnce(new ApiClientError("Forbidden",403));
    await expect(saveNewCheckout(input,scope,"CATALOG","ONLINE",async()=>{})).rejects.toMatchObject({status:403});
    expect(await offlineDb.localSales.count()).toBe(0);
    await expect(saveNewCheckout(input,scope,"CATALOG","OFFLINE",async()=>{})).rejects.toMatchObject({code:"OFFLINE_AUTHORITY_REJECTED"});
  });
  it("does not bypass failed IndexedDB storage by sending an online sale",async()=>{
    const{input}=await setup();vi.mocked(apiClient.post).mockResolvedValue({data:{valid:true}});
    const failure=()=>{throw new DOMException("Storage full","QuotaExceededError");};offlineDb.receipts.hook("creating",failure);
    try{await expect(saveNewCheckout(input,scope,"CATALOG","ONLINE",async()=>{})).rejects.toMatchObject({name:"QuotaExceededError"});}
    finally{offlineDb.receipts.hook("creating").unsubscribe(failure);}
    expect(vi.mocked(apiClient.post).mock.calls.map(call=>call[0])).toEqual(["/orders/sync-v2/validate"]);
    expect(await offlineDb.localSales.count()).toBe(0);expect(await offlineDb.outbox.count()).toBe(0);
  });
  it("returns the original saved receipt after a caller crash without replacing its time, grant or ID",async()=>{
    const{input}=await setup();vi.mocked(apiClient.post).mockResolvedValue({data:{valid:true}});
    const original=await saveNewCheckout(input,scope,"CATALOG","ONLINE",async()=>{});
    const stored=await offlineDb.localSales.get(input.idempotencyKey);
    await offlineDb.permissions.clear();vi.clearAllMocks();
    const retried=await saveNewCheckout(input,scope,"CATALOG","ONLINE",async()=>{throw new Error("a saved sale does not need new intake permission");});
    expect(retried).toMatchObject({id:original.id,totalAmount:original.totalAmount,occurredAt:original.occurredAt});
    expect((await offlineDb.localSales.get(input.idempotencyKey))?.payloadHash).toBe(stored?.payloadHash);expect(apiClient.post).not.toHaveBeenCalled();
    await offlineDb.outbox.update(input.idempotencyKey,{state:"NEEDS_REVIEW"});
    expect((await saveNewCheckout(input,scope,"CATALOG","ONLINE",async()=>{})).localStatus).toBe("NEEDS_REVIEW");
    await expect(saveNewCheckout({...input,tenderedAmount:2000},scope,"CATALOG","ONLINE",async()=>{})).rejects.toMatchObject({code:"SALE_ID_CONFLICT"});
  });
  it("pauses only new intake with the release switch while preserving saved-receipt recovery",async()=>{
    const{input}=await setup();vi.mocked(apiClient.post).mockResolvedValue({data:{valid:true}});
    const saved=await saveNewCheckout(input,scope,"CATALOG","ONLINE",async()=>{});
    vi.stubEnv("NEXT_PUBLIC_OFFLINE_INTAKE","false");vi.clearAllMocks();
    try {
      expect((await saveNewCheckout(input,scope,"CATALOG","ONLINE",async()=>{})).id).toBe(saved.id);
      await expect(saveNewCheckout({...input,idempotencyKey:crypto.randomUUID()},scope,"CATALOG","ONLINE",async()=>{})).rejects.toMatchObject({code:"INTAKE_DISABLED"});
      expect(apiClient.post).not.toHaveBeenCalled();expect(await offlineDb.localSales.count()).toBe(1);
    } finally { vi.unstubAllEnvs(); }
  });
});
