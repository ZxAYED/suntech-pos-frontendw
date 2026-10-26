"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, PackagePlus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
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
import {
  useAddVariantImages,
  useCategories,
  useCreateCategory,
  useCreateProduct,
  useCreateVariant,
  useDeleteCategory,
  useDeleteProduct,
  useDeleteProfileImage,
  useDeleteVariant,
  useDeleteVariantImage,
  useProducts,
  useSetProfileImage,
  useSetStock,
  useUpdateCategory,
  useUpdateProduct,
  useUpdateVariant,
  useVariantImages,
  useVariants,
} from "@/features/catalog/api/use-catalog";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import { useDebounce } from "@/hooks/use-debounce";
import { canViewSensitiveFinancialData } from "@/lib/permissions";
import { formatBDT } from "@/lib/utils";
import type { RootState } from "@/redux/types";
import type { Category, Product, UserRole, Variant } from "@/types/domain";

type Modal = "category" | "product-create" | "product-edit" | "variant" | "stock" | "images" | null;
type Draft = { productId: string; productName: string };
const emptyForm = { name: "", description: "", categoryId: "NONE", sku: "", barcode: "", sellingPrice: "", costPrice: "", stock: "0" };

function draftKey(userId?: string, businessId?: string) { return userId && businessId ? `stpos:v1:${userId}:${businessId}:incompleteProduct` : ""; }

export function CatalogManager({ role = "ADMIN" }: { role?: UserRole }) {
  const tenant = useTenantScope("admin");
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const scope = tenant.buildQueryParams({});
  const enabled = tenant.isTenantReady;
  const categoriesQuery = useCategories(scope, enabled);
  const productsQuery = useProducts(scope, enabled);
  const variantsQuery = useVariants(scope, enabled);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250).toLowerCase();
  const [categoryId, setCategoryId] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modal, setModal] = useState<Modal>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const imagesQuery = useVariantImages(modal === "images" ? selectedVariant?.id : undefined, tenant.businessId);

  const createCategory = useCreateCategory(); const updateCategory = useUpdateCategory(); const deleteCategory = useDeleteCategory();
  const createProduct = useCreateProduct(); const updateProduct = useUpdateProduct(); const deleteProduct = useDeleteProduct();
  const createVariant = useCreateVariant(); const updateVariant = useUpdateVariant(); const deleteVariant = useDeleteVariant();
  const setStock = useSetStock(); const setProfileImage = useSetProfileImage(); const deleteProfileImage = useDeleteProfileImage();
  const addImages = useAddVariantImages(); const deleteImage = useDeleteVariantImage();

  useEffect(() => {
    const key = draftKey(userId, tenant.businessId);
    const timer = window.setTimeout(() => {
      if (!key) { setDraft(null); return; }
      try {
        const parsed = JSON.parse(window.localStorage.getItem(key) ?? "null") as Draft | null;
        setDraft(parsed && typeof parsed.productId === "string" && typeof parsed.productName === "string" ? parsed : null);
      } catch { setDraft(null); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [tenant.businessId, userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => setPage(1), 0);
    return () => window.clearTimeout(timer);
  }, [categoryId, debouncedSearch]);

  const categories = categoriesQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const rows = useMemo(() => (variantsQuery.data ?? []).filter((row) =>
    (categoryId === "ALL" || row.categoryId === categoryId) &&
    (!debouncedSearch || [row.name, row.productName, row.sku, row.barcode].some((value) => value?.toLowerCase().includes(debouncedSearch))),
  ), [categoryId, debouncedSearch, variantsQuery.data]);
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const canViewCost = canViewSensitiveFinancialData(role);
  const metrics = useMemo(() => ({
    products: products.length,
    units: rows.reduce((sum, row) => sum + row.stock, 0),
    low: rows.filter((row) => row.stock <= 5).length,
    value: rows.reduce((sum, row) => sum + row.stock * (row.costPrice ?? row.sellingPrice), 0),
  }), [products.length, rows]);

  if (!tenant.isTenantReady) return <TenantRequiredState />;

  const setIncompleteDraft = (next: Draft | null) => {
    setDraft(next);
    const key = draftKey(userId, tenant.businessId);
    if (!key) return;
    if (next) window.localStorage.setItem(key, JSON.stringify(next)); else window.localStorage.removeItem(key);
  };
  const resetSelection = () => { setSelectedCategory(null); setSelectedProduct(null); setSelectedVariant(null); setForm(emptyForm); };
  const closeModal = () => { setModal(null); resetSelection(); };
  const openCategory = (category?: Category) => { resetSelection(); setSelectedCategory(category ?? null); setForm({ ...emptyForm, name: category?.name ?? "", description: category?.description ?? "" }); setModal("category"); };
  const openProduct = (product?: Product) => { resetSelection(); setSelectedProduct(product ?? null); setForm({ ...emptyForm, name: product?.name ?? "", description: product?.description ?? "", categoryId: product?.categoryId ?? "NONE" }); setModal(product ? "product-edit" : "product-create"); };
  const openVariant = (variant?: Variant, product?: Product) => { resetSelection(); setSelectedVariant(variant ?? null); setSelectedProduct(product ?? products.find((item) => item.id === variant?.productId) ?? null); setForm({ ...emptyForm, name: variant?.name ?? "", sku: variant?.sku ?? "", barcode: variant?.barcode ?? "", sellingPrice: variant ? String(variant.sellingPrice) : "", costPrice: variant?.costPrice == null ? "" : String(variant.costPrice), stock: variant ? String(variant.stock) : "0" }); setModal("variant"); };
  const resumeDraft = () => { if (!draft) return; resetSelection(); setSelectedProduct(products.find((item) => item.id === draft.productId) ?? { id: draft.productId, name: draft.productName, categoryId: null, isActive: true }); setModal("product-create"); };

  const notifyError = (error: unknown) => toast.error(error instanceof Error ? error.message : "Request failed");
  const saveCategory = async (event: React.FormEvent) => { event.preventDefault(); try { const body = { name: form.name.trim(), description: form.description.trim() || undefined, businessId: tenant.businessId }; if (selectedCategory) await updateCategory.mutateAsync({ id: selectedCategory.id, ...body }); else await createCategory.mutateAsync(body); toast.success("Category saved"); closeModal(); } catch (error) { notifyError(error); } };
  const saveProduct = async (event: React.FormEvent) => { event.preventDefault(); try { const body = { name: form.name.trim(), description: form.description.trim() || undefined, categoryId: form.categoryId === "NONE" ? null : form.categoryId, businessId: tenant.businessId }; if (selectedProduct) await updateProduct.mutateAsync({ id: selectedProduct.id, ...body }); else { const product = await createProduct.mutateAsync({ ...body, categoryId: body.categoryId ?? undefined }) as Product; const next = { productId: product.id, productName: product.name }; setIncompleteDraft(next); setSelectedProduct(product); setForm({ ...emptyForm, name: "Default" }); toast.success("Product created. Add its first variant to finish."); return; } toast.success("Product saved"); closeModal(); } catch (error) { notifyError(error); } };
  const saveVariant = async (event: React.FormEvent) => { event.preventDefault(); const productId = selectedProduct?.id ?? (modal === "product-create" ? draft?.productId : undefined); if (!productId) return; try { const body = { productId, name: form.name.trim(), sku: form.sku.trim() || undefined, barcode: form.barcode.trim() || null, sellingPrice: Number(form.sellingPrice), costPrice: form.costPrice ? Number(form.costPrice) : null, businessId: tenant.businessId, locationId: tenant.locationId }; if (selectedVariant) await updateVariant.mutateAsync({ id: selectedVariant.id, ...body }); else await createVariant.mutateAsync({ ...body, stock: Number(form.stock || 0) }); if (modal === "product-create") setIncompleteDraft(null); toast.success("Variant saved"); closeModal(); } catch (error) { notifyError(error); } };
  const saveStock = async (event: React.FormEvent) => { event.preventDefault(); if (!selectedVariant) return; try { await setStock.mutateAsync({ id: selectedVariant.id, stock: Number(form.stock), businessId: tenant.businessId, locationId: tenant.locationId }); toast.success("Branch stock updated"); closeModal(); } catch (error) { notifyError(error); } };

  const confirmDelete = async (label: string, action: () => Promise<unknown>) => { if (!window.confirm(`Delete ${label}?`)) return; try { await action(); toast.success("Deleted"); } catch (error) { notifyError(error); } };
  const openImages = (variant: Variant) => { resetSelection(); setSelectedVariant(variant); setModal("images"); };
  const uploadProfile = async (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file || !selectedVariant) return; try { const result = await setProfileImage.mutateAsync({ variantId: selectedVariant.id, file, businessId: tenant.businessId }) as { profileImageUrl?: string }; if (result.profileImageUrl) setSelectedVariant({ ...selectedVariant, profileImageUrl: result.profileImageUrl }); toast.success("Profile image updated"); } catch (error) { notifyError(error); } event.target.value = ""; };
  const uploadGallery = async (event: React.ChangeEvent<HTMLInputElement>) => { const files = Array.from(event.target.files ?? []); if (!files.length || !selectedVariant) return; try { await addImages.mutateAsync({ variantId: selectedVariant.id, files, businessId: tenant.businessId }); await imagesQuery.refetch(); toast.success("Gallery updated"); } catch (error) { notifyError(error); } event.target.value = ""; };

  const loading = categoriesQuery.isPending || productsQuery.isPending || variantsQuery.isPending;
  const failed = categoriesQuery.isError || productsQuery.isError || variantsQuery.isError;
  const retry = () => { void categoriesQuery.refetch(); void productsQuery.refetch(); void variantsQuery.refetch(); };

  return <div className="space-y-6">
    <PageHeader title="Catalog" actions={<><Button variant="outline" onClick={() => openCategory()}><Plus className="mr-2 h-4 w-4" />Category</Button><Button onClick={() => openProduct()}><PackagePlus className="mr-2 h-4 w-4" />Product</Button></>} />
    {draft ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm"><span><strong>{draft.productName}</strong> exists but still needs its first variant.</span><Button size="sm" onClick={resumeDraft}>Resume setup</Button></div> : null}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Products" value={String(metrics.products)} icon={PackagePlus} /><MetricCard label="Units in branch" value={String(metrics.units)} icon={PackagePlus} /><MetricCard label="Low stock SKUs" value={String(metrics.low)} icon={PackagePlus} /><MetricCard label="Inventory value" value={canViewCost ? formatBDT(metrics.value) : "Restricted"} icon={PackagePlus} /></div>
    <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="grid gap-3 md:grid-cols-[1fr_240px_auto]"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" placeholder="Search product, variant, SKU, or barcode" value={search} onChange={(event) => setSearch(event.target.value)} /></div><Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All categories</SelectItem>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select><Button variant="outline" onClick={() => openVariant(undefined, products[0])} disabled={!products.length}><Plus className="mr-2 h-4 w-4" />Variant</Button></div></div>
    <DataState data={pageRows} isLoading={loading} isError={failed} resource="catalog" emptyTitle="No catalog variants found" emptyDescription="Create a product and its first variant to begin." onRetry={retry}>{(data) => <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><Table><TableHeader><TableRow><TableHead>Product / variant</TableHead><TableHead>Category</TableHead><TableHead>SKU / barcode</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{data.map((row) => <TableRow key={row.id}><TableCell><div className="font-medium">{row.productName}</div><div className="text-xs text-slate-500">{row.name || "Default"}</div></TableCell><TableCell>{row.categoryName || "Uncategorized"}</TableCell><TableCell><div className="font-mono text-xs">{row.sku}</div><div className="text-xs text-slate-500">{row.barcode || "—"}</div></TableCell><TableCell className="text-right font-mono">{formatBDT(row.sellingPrice)}</TableCell><TableCell className="text-right"><Badge variant={row.stock <= 5 ? "pending" : "outline"}>{row.stock}</Badge></TableCell><TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" title="Edit variant" onClick={() => openVariant(row)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" title="Set stock" onClick={() => { setSelectedVariant(row); setForm({ ...emptyForm, stock: String(row.stock) }); setModal("stock"); }}><PackagePlus className="h-4 w-4" /></Button><Button variant="ghost" size="icon" title="Manage images" onClick={() => openImages(row)}><ImagePlus className="h-4 w-4" /></Button><Button variant="ghost" size="icon" title="Delete variant" onClick={() => void confirmDelete(row.name || row.sku, () => deleteVariant.mutateAsync({ id: row.id, businessId: tenant.businessId }))}><Trash2 className="h-4 w-4 text-rose-600" /></Button></div></TableCell></TableRow>)}</TableBody></Table><DataPagination currentPage={page} totalPages={totalPages} totalItems={rows.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} itemLabel="variants" /></div>}</DataState>

    <div className="grid gap-4 lg:grid-cols-2"><section className="rounded-xl border border-slate-200 bg-white p-4"><h2 className="mb-3 font-semibold">Categories</h2><div className="space-y-2">{categories.map((category) => <div key={category.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="font-medium">{category.name}</p><p className="text-xs text-slate-500">{category.description || "No description"}</p></div><div><Button variant="ghost" size="icon" onClick={() => openCategory(category)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => void confirmDelete(category.name, () => deleteCategory.mutateAsync({ id: category.id, businessId: tenant.businessId }))}><Trash2 className="h-4 w-4 text-rose-600" /></Button></div></div>)}</div></section><section className="rounded-xl border border-slate-200 bg-white p-4"><h2 className="mb-3 font-semibold">Products</h2><div className="space-y-2">{products.map((product) => <div key={product.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="font-medium">{product.name}</p><p className="text-xs text-slate-500">{product.category?.name || "Uncategorized"}</p></div><div><Button variant="ghost" size="icon" onClick={() => openProduct(product)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => openVariant(undefined, product)}><Plus className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => void confirmDelete(product.name, () => deleteProduct.mutateAsync({ id: product.id, businessId: tenant.businessId }))}><Trash2 className="h-4 w-4 text-rose-600" /></Button></div></div>)}</div></section></div>

    <Dialog open={modal === "category"} onOpenChange={(open) => !open && closeModal()}><DialogContent><DialogHeader><DialogTitle>{selectedCategory ? "Edit" : "Create"} category</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={saveCategory}><Input required maxLength={120} placeholder="Category name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Input maxLength={500} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /><ModalActions close={closeModal} /></form></DialogContent></Dialog>
    <Dialog open={modal === "product-edit" || modal === "product-create"} onOpenChange={(open) => !open && closeModal()}><DialogContent><DialogHeader><DialogTitle>{modal === "product-edit" ? "Edit product" : selectedProduct || draft ? "Step 2 — first variant" : "Step 1 — product"}</DialogTitle></DialogHeader>{modal === "product-create" && (selectedProduct || draft) ? <form className="space-y-4" onSubmit={saveVariant}><VariantFields form={form} setForm={setForm} /><p className="text-xs text-slate-500">If this request fails, the created product ID is retained so setup can be resumed without creating a duplicate.</p><ModalActions close={closeModal} label="Finish product" /></form> : <form className="space-y-4" onSubmit={saveProduct}><Input required maxLength={120} placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Input maxLength={500} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /><CategorySelect categories={categories} value={form.categoryId} onChange={(value) => setForm({ ...form, categoryId: value })} /><ModalActions close={closeModal} label={modal === "product-create" ? "Create & continue" : "Save"} /></form>}</DialogContent></Dialog>
    <Dialog open={modal === "variant"} onOpenChange={(open) => !open && closeModal()}><DialogContent><DialogHeader><DialogTitle>{selectedVariant ? "Edit" : "Add"} variant {selectedProduct ? `— ${selectedProduct.name}` : ""}</DialogTitle></DialogHeader>{!selectedProduct ? <Select value="" onValueChange={(id) => setSelectedProduct(products.find((item) => item.id === id) ?? null)}><SelectTrigger><SelectValue placeholder="Choose product" /></SelectTrigger><SelectContent>{products.map((product) => <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>)}</SelectContent></Select> : null}<form className="space-y-4" onSubmit={saveVariant}><VariantFields form={form} setForm={setForm} /><ModalActions close={closeModal} /></form></DialogContent></Dialog>
    <Dialog open={modal === "stock"} onOpenChange={(open) => !open && closeModal()}><DialogContent><DialogHeader><DialogTitle>Set branch stock — {selectedVariant?.sku}</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={saveStock}><Input required type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /><p className="text-xs text-slate-500">This sets the absolute stock for the selected branch and records an inventory adjustment.</p><ModalActions close={closeModal} label="Update stock" /></form></DialogContent></Dialog>
    <Dialog open={modal === "images"} onOpenChange={(open) => !open && closeModal()}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Images — {selectedVariant?.sku}</DialogTitle></DialogHeader><div className="space-y-5"><div className="flex flex-wrap gap-2"><label className="inline-flex cursor-pointer items-center rounded-md bg-[#0052FF] px-4 py-2 text-sm text-white"><ImagePlus className="mr-2 h-4 w-4" />Set profile<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={uploadProfile} /></label><label className="inline-flex cursor-pointer items-center rounded-md border px-4 py-2 text-sm"><Plus className="mr-2 h-4 w-4" />Add gallery<input type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={uploadGallery} /></label>{selectedVariant?.profileImageUrl ? <Button variant="outline" onClick={() => void deleteProfileImage.mutateAsync({ variantId: selectedVariant.id, businessId: tenant.businessId }).catch(notifyError)}>Remove profile</Button> : null}</div>{selectedVariant?.profileImageUrl ? <div className="aspect-video w-full rounded-xl bg-slate-100 bg-cover bg-center" role="img" aria-label="Variant profile" style={{ backgroundImage: `url(${JSON.stringify(selectedVariant.profileImageUrl).slice(1, -1)})` }} /> : null}<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{(imagesQuery.data ?? []).map((image) => <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100 bg-cover bg-center" role="img" aria-label="Variant gallery image" style={{ backgroundImage: `url(${JSON.stringify(image.url).slice(1, -1)})` }}><Button className="absolute right-2 top-2 opacity-90" variant="destructive" size="icon" onClick={() => selectedVariant && void deleteImage.mutateAsync({ variantId: selectedVariant.id, imageId: image.id, businessId: tenant.businessId }).then(() => imagesQuery.refetch()).catch(notifyError)}><Trash2 className="h-4 w-4" /></Button></div>)}</div></div></DialogContent></Dialog>
  </div>;
}

function ModalActions({ close, label = "Save" }: { close: () => void; label?: string }) { return <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={close}>Cancel</Button><Button type="submit">{label}</Button></div>; }
function CategorySelect({ categories, value, onChange }: { categories: Category[]; value: string; onChange: (value: string) => void }) { return <Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger><SelectContent><SelectItem value="NONE">Uncategorized</SelectItem>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select>; }
function VariantFields({ form, setForm }: { form: typeof emptyForm; setForm: (value: typeof emptyForm) => void }) { return <><Input required maxLength={120} placeholder="Variant name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><div className="grid grid-cols-2 gap-3"><Input maxLength={64} placeholder="SKU (auto if empty)" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /><Input maxLength={64} placeholder="Barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></div><div className="grid grid-cols-3 gap-3"><Input required type="number" min="0" step="1" placeholder="Selling price" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} /><Input type="number" min="0" step="1" placeholder="Cost price" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /><Input required type="number" min="0" step="1" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div></>; }
