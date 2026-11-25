import { describe, expect, it } from "vitest";
import { generateReceiptPdfBytes } from "../utils/print-receipt";
import type { ReceiptViewModel } from "../view-models";
const original:ReceiptViewModel={invoiceNumber:"LOCAL-57f2126a-3227-4ec8-a70a-5e3e21aacc20",clientOrderId:"57f2126a-3227-4ec8-a70a-5e3e21aacc20",localStatus:"PENDING",status:"PENDING",businessName:"Test Shop",locationName:"Branch",cashierName:"Operator",customerName:"Walk-in Customer",items:[{id:"line-1",name:"Repair",quantity:1,unitPrice:500,subtotal:500}],subtotal:500,totalAmount:500,tenderedAmount:1000,changeDue:500,paymentMethod:"COD",createdAt:"2026-11-24T10:00:00.000Z",occurredAt:"2026-11-24T10:00:00.000Z"};
const text=(receipt:ReceiptViewModel)=>new TextDecoder().decode(generateReceiptPdfBytes(receipt));
const height=(pdf:string)=>Number(pdf.match(/\/MediaBox \[0 0 [\d.]+ ([\d.]+)\]/)?.[1]);
describe("direct PDF receipt confirmation label",()=>{
 it("prints explicit local and pending labels, with room added to the PDF page",()=>{
  const pending=text(original);const confirmed=text({...original,localStatus:"SYNCED",invoiceNumber:"INV-1",status:"PAID"});
  expect(pending).toContain("LOCAL RECEIPT");expect(pending).toContain("SERVER CONFIRMATION PENDING");
  expect(confirmed).not.toContain("SERVER CONFIRMATION PENDING");expect(confirmed).not.toContain("LOCAL RECEIPT");
  expect(height(pending)).toBeGreaterThan(height(confirmed));
 });
 it("labels a rejected posting as review while preserving the original receipt identity",()=>{
  const pdf=text({...original,localStatus:"NEEDS_REVIEW"});
  expect(pdf).toContain("SERVER REVIEW REQUIRED");expect(pdf).toContain("LOCAL RECEIPT");
  expect(pdf).not.toContain("SERVER CONFIRMATION PENDING");
  expect(original.totalAmount).toBe(500);expect(original.tenderedAmount).toBe(1000);
 });
});
