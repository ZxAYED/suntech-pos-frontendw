"use client";

import { useMemo, useState } from "react";
import { Boxes, PackagePlus, Plus, Search, SlidersHorizontal, Tag } from "lucide-react";
import { toast } from "sonner";
import { DataPagination } from "@/components/common/data-pagination";
import { DataState, TenantRequiredState } from "@/components/common/data-state";
import { MetricCard } from "@/components/common/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMockCatalog, useMockCategories } from "@/features/catalog/api/use-catalog";
import type { CatalogRowViewModel } from "@/features/catalog/view-models";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import { useDebounce } from "@/hooks/use-debounce";
import { canViewSensitiveFinancialData } from "@/lib/permissions";
import { formatBDT } from "@/lib/utils";
import type { UserRole } from "@/types/domain";

type ModalKind = "category" | "product" | "variant" | "stock" | null;

export function CatalogManager({ role = "ADMIN" }: { role?: UserRole }) {
  const tenant = useTenantScope("admin");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [categoryId, setCategoryId] = useState("ALL");
  const [pagination, setPagination] = useState({ page: 1, limit: 8 });
  const [modal, setModal] = useState<ModalKind>(null);
  const [selectedRow, setSelectedRow] = useState<CatalogRowViewModel | null>(null);
  const [form, setForm] = useState({ name: "", categoryId: "", sku: "", barcode: "", sellingPrice: "", stock: "" });
  const categoriesQuery = useMockCategories();
  const catalogQuery = useMockCatalog({ search: debouncedSearch, categoryId: categoryId === "ALL" ? undefined : categoryId, page: pagination.page, limit: pagination.limit });
  const canViewCost = canViewSensitiveFinancialData(role);

  const rows = catalogQuery.data;
  const pageRows = rows.slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit);
  const totalPages = Math.max(1, Math.ceil(rows.length / pagination.limit));
  const metrics = useMemo(() => ({ units: rows.reduce((sum, row) => sum + row.stock, 0), lowStock: rows.filter((row) => row.stock <= (row.minimumStock ?? 5)).length, valuation: rows.reduce((sum, row) => sum + row.stock * (row.costPrice ?? row.sellingPrice), 0) }), [rows]);

  if (!tenant.isTenantReady) return <TenantRequiredState />;

  const openModal = (kind: Exclude<ModalKind, null>, row?: CatalogRowViewModel) => {
    setSelectedRow(row ?? null);
    setForm({ name: row?.productName ?? "", categoryId: row?.categoryId ?? categoriesQuery.data[0]?.id ?? "", sku: row?.sku ?? "", barcode: row?.barcode ?? "", sellingPrice: row ? String(row.sellingPrice) : "", stock: row ? String(row.stock) : "" });
    setModal(kind);
  };

  const saveMock = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || (modal === "variant" && !form.sku.trim())) { toast.error("Complete the required fields."); return; }
    if (["variant", "stock"].includes(modal ?? "") && (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0)) { toast.error("Stock must be a non-negative integer."); return; }
    toast.success(`${modal === "stock" ? "Stock adjustment" : `${modal} fixture`} saved locally.`);
    setModal(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Catalog & Inventory" actions={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => openModal("category")}><Tag className="mr-2 h-4 w-4" />Category</Button><Button variant="outline" onClick={() => openModal("product")}><Boxes className="mr-2 h-4 w-4" />Product</Button><Button onClick={() => openModal("variant")} className="bg-[#0052FF] text-white hover:bg-[#0047E0]"><PackagePlus className="mr-2 h-4 w-4" />Add variant</Button></div>} />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Active variants" value={String(rows.filter((row) => row.isActive).length)} icon={Boxes} />
        <MetricCard label="Units on hand" value={String(metrics.units)} icon={PackagePlus} />
        <MetricCard label={canViewCost ? "Inventory valuation" : "Low stock variants"} value={canViewCost ? formatBDT(metrics.valuation) : String(metrics.lowStock)} icon={SlidersHorizontal} />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPagination((value) => ({ ...value, page: 1 })); }} placeholder="Search product, SKU, or barcode" className="pl-9" /></div>
        <Select value={categoryId} onValueChange={(value) => { setCategoryId(value); setPagination((current) => ({ ...current, page: 1 })); }}><SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All categories</SelectItem>{categoriesQuery.data.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select>
      </div>

      <DataState data={pageRows} isLoading={catalogQuery.isLoading} isError={catalogQuery.isError} resource="catalog" emptyTitle="No products match these filters." onRetry={() => void catalogQuery.refetch()}>
        {(data) => <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"><div className="overflow-x-auto"><Table><TableHeader className="bg-slate-50"><TableRow><TableHead>Product / Variant</TableHead><TableHead>Category</TableHead><TableHead>SKU / Barcode</TableHead>{canViewCost ? <TableHead className="text-right">Cost</TableHead> : null}<TableHead className="text-right">Selling price</TableHead><TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{data.map((row) => <TableRow key={row.variantId}><TableCell><p className="font-medium text-[#070B28]">{row.productName}</p><p className="text-xs text-slate-500">{row.variantName || "Default variant"}</p></TableCell><TableCell>{row.categoryName}</TableCell><TableCell><p className="font-mono text-xs">{row.sku}</p><p className="font-mono text-[11px] text-slate-400">{row.barcode || "No barcode"}</p></TableCell>{canViewCost ? <TableCell className="text-right font-mono">{formatBDT(row.costPrice ?? 0)}</TableCell> : null}<TableCell className="text-right font-mono font-medium">{formatBDT(row.sellingPrice)}</TableCell><TableCell className="text-right"><Badge variant="outline" className={row.stock <= (row.minimumStock ?? 5) ? "border-amber-200 bg-amber-50 text-amber-700" : ""}>{row.stock}</Badge></TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => openModal("variant", row)}>Edit</Button><Button variant="ghost" size="sm" onClick={() => openModal("stock", row)}>Stock</Button></TableCell></TableRow>)}</TableBody></Table></div><div className="border-t border-slate-200 px-4"><DataPagination currentPage={pagination.page} totalPages={totalPages} totalItems={rows.length} pageSize={pagination.limit} onPageChange={(page) => setPagination((value) => ({ ...value, page }))} onPageSizeChange={(limit) => setPagination({ page: 1, limit })} itemLabel="variants" /></div></div>}
      </DataState>

      <Dialog open={modal !== null} onOpenChange={(open) => !open && setModal(null)}><DialogContent><DialogHeader><DialogTitle>{modal === "category" ? "Category" : modal === "product" ? "Product" : modal === "stock" ? "Stock adjustment" : "Variant"}</DialogTitle></DialogHeader><form onSubmit={saveMock} className="space-y-4">
        {modal !== "stock" ? <div><label htmlFor="catalog-name" className="text-xs font-medium">Name *</label><Input id="catalog-name" value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} /></div> : <p className="text-sm text-slate-600">{selectedRow?.productName} · Current stock {selectedRow?.stock}</p>}
        {(modal === "product" || modal === "variant") ? <div><label className="text-xs font-medium">Category</label><Select value={form.categoryId} onValueChange={(value) => setForm((current) => ({ ...current, categoryId: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categoriesQuery.data.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select></div> : null}
        {modal === "variant" ? <><div><label htmlFor="variant-sku" className="text-xs font-medium">SKU *</label><Input id="variant-sku" value={form.sku} onChange={(event) => setForm((value) => ({ ...value, sku: event.target.value.toUpperCase() }))} /></div><div><label htmlFor="variant-barcode" className="text-xs font-medium">Barcode</label><Input id="variant-barcode" value={form.barcode} onChange={(event) => setForm((value) => ({ ...value, barcode: event.target.value }))} /></div><div><label htmlFor="variant-price" className="text-xs font-medium">Selling price (BDT) *</label><Input id="variant-price" type="number" min="0" step="1" value={form.sellingPrice} onChange={(event) => setForm((value) => ({ ...value, sellingPrice: event.target.value }))} /></div></> : null}
        {(modal === "variant" || modal === "stock") ? <div><label htmlFor="variant-stock" className="text-xs font-medium">{modal === "stock" ? "New quantity" : "Opening stock"}</label><Input id="variant-stock" type="number" min="0" step="1" value={form.stock} onChange={(event) => setForm((value) => ({ ...value, stock: event.target.value }))} /></div> : null}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" className="bg-[#0052FF] text-white"><Plus className="mr-2 h-4 w-4" />Save mock change</Button></div>
      </form></DialogContent></Dialog>
    </div>
  );
}
