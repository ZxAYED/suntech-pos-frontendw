"use client";

import { useMemo, useState } from "react";
import { Eye, MoreHorizontal, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { DataPagination } from "@/components/common/data-pagination";
import { DataState } from "@/components/common/data-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMockOrders } from "@/features/pos/api/use-pos";
import type { OrderRowViewModel } from "@/features/pos/view-models";
import { useDebounce } from "@/hooks/use-debounce";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/payment-methods";
import { formatBDT } from "@/lib/utils";
import type { PaymentMethod } from "@/types/domain";

interface Filters { search: string; status: string; paymentMethod: string; orderType: string; range: string; page: number; limit: number; }

export default function PosOrdersPage() {
  const [filters, setFilters] = useState<Filters>({ search: "", status: "ALL", paymentMethod: "ALL", orderType: "ALL", range: "all", page: 1, limit: 8 });
  const search = useDebounce(filters.search, 250);
  const query = useMockOrders({ search, status: filters.status === "ALL" ? undefined : filters.status, paymentMethod: filters.paymentMethod === "ALL" ? undefined : filters.paymentMethod as PaymentMethod, orderType: filters.orderType === "ALL" ? undefined : filters.orderType, range: filters.range, page: filters.page, limit: filters.limit });
  const [selected, setSelected] = useState<OrderRowViewModel | null>(null);
  const [refundOrder, setRefundOrder] = useState<OrderRowViewModel | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundQty, setRefundQty] = useState<Record<string, number>>({});
  const pageRows = query.data.slice((filters.page - 1) * filters.limit, filters.page * filters.limit);
  const totalPages = Math.max(1, Math.ceil(query.data.length / filters.limit));
  const refundTotal = useMemo(() => refundOrder?.order.lines.reduce((sum, line) => sum + Math.min(refundQty[line.id] ?? 0, line.quantity) * line.unitPrice, 0) ?? 0, [refundOrder, refundQty]);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((current) => ({ ...current, [key]: value, ...(key !== "page" ? { page: 1 } : {}) }));
  const openRefund = (row: OrderRowViewModel) => { setRefundOrder(row); setRefundReason(""); setRefundQty({}); };
  const confirmRefund = () => {
    const items = Object.entries(refundQty).filter(([, quantity]) => quantity > 0).map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
    if (!items.length) { toast.error("Select at least one refundable item quantity."); return; }
    toast.success(`Mock refund prepared for ${formatBDT(refundTotal)}.`); setRefundOrder(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Register Tickets & Order History" />
      <Card className="border-slate-200 p-4 shadow-xs"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"><div className="relative xl:col-span-2"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={filters.search} onChange={(event) => setFilter("search", event.target.value)} placeholder="Invoice, customer, or item" className="pl-9" /></div><FilterSelect value={filters.status} onChange={(value) => setFilter("status", value)} options={[{ value: "ALL", label: "All statuses" }, { value: "PAID", label: "Paid" }, { value: "REFUNDED", label: "Refunded" }]} /><FilterSelect value={filters.paymentMethod} onChange={(value) => setFilter("paymentMethod", value)} options={[{ value: "ALL", label: "All payments" }, ...PAYMENT_METHOD_OPTIONS]} /><FilterSelect value={filters.orderType} onChange={(value) => setFilter("orderType", value)} options={[{ value: "ALL", label: "All order types" }, { value: "CATALOG", label: "Catalog" }, { value: "CUSTOM", label: "Custom" }]} /></div></Card>

      <DataState data={pageRows} isLoading={query.isLoading} isError={query.isError} resource="orders" emptyTitle="No orders found." emptyDescription="Try changing the current search or filters." onRetry={() => void query.refetch()}>
        {(rows) => <Card className="overflow-hidden border-slate-200 shadow-xs"><div className="overflow-x-auto"><Table><TableHeader className="bg-slate-50"><TableRow><TableHead>Customer & items</TableHead><TableHead>Payment</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.id}><TableCell><p className="font-medium text-[#070B28]">{row.customerName || "Walk-in customer"}</p><p className="text-xs text-slate-600">{row.summary}</p><p className="mt-1 font-mono text-[11px] text-slate-400">#{row.invoiceNumber} · {new Date(row.createdAt).toLocaleString("en-BD")}</p></TableCell><TableCell>{row.paymentLabel}</TableCell><TableCell className="text-right font-mono font-semibold">{formatBDT(row.totalAmount)}</TableCell><TableCell><Badge variant="outline" className={row.status === "PAID" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}>{row.status}</Badge></TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${row.invoiceNumber}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setSelected(row)}><Eye className="mr-2 h-4 w-4" />View details</DropdownMenuItem><DropdownMenuItem disabled={row.status === "REFUNDED"} onClick={() => openRefund(row)} className="text-rose-600"><RotateCcw className="mr-2 h-4 w-4" />Refund</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}</TableBody></Table></div><div className="border-t border-slate-200 px-4"><DataPagination currentPage={filters.page} totalPages={totalPages} totalItems={query.data.length} pageSize={filters.limit} onPageChange={(page) => setFilter("page", page)} onPageSizeChange={(limit) => setFilters((current) => ({ ...current, page: 1, limit }))} itemLabel="orders" /></div></Card>}
      </DataState>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Order {selected?.invoiceNumber}</DialogTitle></DialogHeader>{selected ? <div className="space-y-4"><div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2"><Detail label="Status" value={selected.status} /><Detail label="Customer" value={selected.customerName || "Walk-in customer"} /><Detail label="Date" value={new Date(selected.createdAt).toLocaleString("en-BD")} /><Detail label="Cashier" value={selected.cashierName || "Not recorded"} /><Detail label="Location" value={selected.locationName || selected.order.locationId} /><Detail label="Payment" value={selected.paymentLabel} /></div><div className="divide-y rounded-lg border border-slate-200">{selected.order.lines.map((line) => <div key={line.id} className="flex justify-between p-3 text-sm"><span>{line.productName}{line.variantName ? ` · ${line.variantName}` : ""} × {line.quantity}</span><span className="font-mono">{formatBDT(line.subtotal)}</span></div>)}</div><div className="flex justify-between font-semibold"><span>Total</span><span className="font-mono">{formatBDT(selected.totalAmount)}</span></div></div> : null}</DialogContent></Dialog>

      <Dialog open={refundOrder !== null} onOpenChange={(open) => !open && setRefundOrder(null)}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Prepare refund · {refundOrder?.invoiceNumber}</DialogTitle></DialogHeader>{refundOrder ? <div className="space-y-4"><div className="divide-y rounded-lg border border-slate-200">{refundOrder.order.lines.map((line) => <div key={line.id} className="grid grid-cols-[1fr_90px] items-center gap-3 p-3"><div><p className="text-sm font-medium">{line.productName}</p><p className="text-xs text-slate-500">Refundable quantity: {line.quantity} · {formatBDT(line.unitPrice)} each</p></div><Input type="number" min="0" max={line.quantity} step="1" value={refundQty[line.id] ?? 0} onChange={(event) => setRefundQty((current) => ({ ...current, [line.id]: Math.min(line.quantity, Math.max(0, Number.parseInt(event.target.value, 10) || 0)) }))} /></div>)}</div><div><label htmlFor="refund-reason" className="text-xs font-medium">Reason (optional)</label><Input id="refund-reason" value={refundReason} onChange={(event) => setRefundReason(event.target.value)} /></div><div className="flex items-center justify-between rounded-lg bg-rose-50 p-3"><span className="text-sm font-medium text-rose-800">Refund total</span><span className="font-mono font-bold text-rose-700">{formatBDT(refundTotal)}</span></div><Button className="w-full bg-rose-600 text-white hover:bg-rose-700" onClick={confirmRefund}>Confirm mock refund</Button></div> : null}</DialogContent></Dialog>
    </div>
  );
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) { return <Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>; }
function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-slate-400">{label}</p><p className="font-medium text-[#070B28]">{value}</p></div>; }
