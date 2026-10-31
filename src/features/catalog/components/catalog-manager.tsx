"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, PackagePlus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { DataPagination } from "@/components/common/data-pagination";
import { DataState, TenantRequiredState } from "@/components/common/data-state";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { MetricCard } from "@/components/common/metric-card";
import { VariantImageCarousel } from "@/components/common/variant-image-carousel";
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
  useProductSummary,
  useSetProfileImage,
  useSetStock,
  useUpdateCategory,
  useUpdateProduct,
  useUpdateVariant,
  useVariantImages,
  useVariants,
} from "@/features/catalog/api/use-catalog";
import { mapVariantToCatalogRow } from "@/features/catalog/view-models";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import { useDebounce } from "@/hooks/use-debounce";
import { canViewSensitiveFinancialData } from "@/lib/permissions";
import { formatBDT } from "@/lib/utils";
import { adjustStockSchema, categoryFormSchema, productFormSchema, variantFormSchema } from "@/lib/validations";
import type { RootState } from "@/redux/types";
import type { Category, Product, UserRole, Variant } from "@/types/domain";

type Modal = "category" | "product-create" | "product-edit" | "variant" | "stock" | "images" | null;
type Draft = { productId: string; productName: string };
const emptyForm = { name: "", description: "", categoryId: "", sku: "", barcode: "", sellingPrice: "", costPrice: "", stock: "0" };

function draftKey(userId?: string, businessId?: string) {
  return userId && businessId ? `stpos:v1:${userId}:${businessId}:incompleteProduct` : "";
}

export function CatalogManager({ role = "ADMIN" }: { role?: UserRole }) {
  const tenant = useTenantScope("admin");
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const scope = tenant.buildQueryParams({});
  // Check parameters before hitting categories, products, variants APIs
  const enabled = tenant.isTenantReady && Boolean(scope.businessId && scope.locationId);

  const categoriesQuery = useCategories(scope, Boolean(scope.businessId));
  const productsQuery = useProducts(scope, enabled);
  const variantsQuery = useVariants(scope, enabled);
  const summaryQuery = useProductSummary(scope, enabled);

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
  const [deleteTarget, setDeleteTarget] = useState<{
    title: string;
    itemName: string;
    action: () => Promise<unknown>;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const imagesQuery = useVariantImages(modal === "images" ? selectedVariant?.id : undefined, tenant.businessId);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createVariant = useCreateVariant();
  const updateVariant = useUpdateVariant();
  const deleteVariant = useDeleteVariant();
  const setStock = useSetStock();
  const setProfileImage = useSetProfileImage();
  const deleteProfileImage = useDeleteProfileImage();
  const addImages = useAddVariantImages();
  const deleteImage = useDeleteVariantImage();

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

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);

  const activeCategoryFilter = useMemo(() => {
    if (categoryId === "ALL") return null;
    return categories.find((c) => c.id === categoryId) ?? null;
  }, [categories, categoryId]);

  const rows = useMemo(() => (variantsQuery.data ?? [])
    .map((variant) => mapVariantToCatalogRow(variant, products, categories))
    .filter((row) => {
      const matchesCategory =
        categoryId === "ALL" ||
        row.categoryId === categoryId ||
        (activeCategoryFilter && row.categoryName?.trim().toLowerCase() === activeCategoryFilter.name.trim().toLowerCase());
      const matchesSearch =
        !debouncedSearch ||
        [row.name, row.variantName, row.productName, row.sku, row.barcode, row.categoryName].some((value) =>
          value?.toLowerCase().includes(debouncedSearch),
        );
      return matchesCategory && matchesSearch;
    }), [categoryId, activeCategoryFilter, debouncedSearch, variantsQuery.data, products, categories]);

  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const canViewCost = canViewSensitiveFinancialData(role);

  const metrics = useMemo(() => {
    if (summaryQuery.data) {
      return {
        products: summaryQuery.data.products,
        units: summaryQuery.data.unitsInBranch ?? summaryQuery.data.units,
        low: summaryQuery.data.lowStockSkus ?? summaryQuery.data.lowStock,
        value: summaryQuery.data.inventoryValue ?? summaryQuery.data.value,
      };
    }
    return {
      products: products.length,
      units: rows.reduce((sum, row) => sum + row.stock, 0),
      low: rows.filter((row) => row.stock <= (row.minimumStock ?? 5)).length,
      value: rows.reduce((sum, row) => sum + (row.costPrice != null ? row.stock * row.costPrice : 0), 0),
    };
  }, [summaryQuery.data, products.length, rows]);

  if (!tenant.isTenantReady) return <TenantRequiredState />;

  const setIncompleteDraft = (next: Draft | null) => {
    setDraft(next);
    const key = draftKey(userId, tenant.businessId);
    if (!key) return;
    if (next) window.localStorage.setItem(key, JSON.stringify(next)); else window.localStorage.removeItem(key);
  };

  const resetSelection = () => {
    setSelectedCategory(null);
    setSelectedProduct(null);
    setSelectedVariant(null);
    setForm(emptyForm);
  };

  const closeModal = () => { setModal(null); resetSelection(); };

  const openCategory = (category?: Category) => {
    resetSelection();
    setSelectedCategory(category ?? null);
    setForm({ ...emptyForm, name: category?.name ?? "", description: category?.description ?? "" });
    setModal("category");
  };

  const openProduct = (product?: Product) => {
    resetSelection();
    setSelectedProduct(product ?? null);
    setForm({
      ...emptyForm,
      name: product?.name ?? "",
      description: product?.description ?? "",
      categoryId: product?.categoryId ?? (categories[0]?.id || ""),
    });
    setModal(product ? "product-edit" : "product-create");
  };

  const openVariant = (variant?: Variant | { rawVariant?: Variant }, product?: Product) => {
    const raw = variant && "rawVariant" in variant && variant.rawVariant ? variant.rawVariant : (variant as Variant | undefined);
    resetSelection();
    setSelectedVariant(raw ?? null);
    setSelectedProduct(product ?? products.find((item) => item.id === raw?.productId) ?? null);
    setForm({
      ...emptyForm,
      name: raw?.name ?? "",
      sku: raw?.sku ?? "",
      barcode: raw?.barcode ?? "",
      sellingPrice: raw ? String(raw.sellingPrice) : "",
      costPrice: raw?.costPrice == null ? "" : String(raw.costPrice),
      stock: raw ? String(raw.stock) : "0",
    });
    setModal("variant");
  };

  const resumeDraft = () => {
    if (!draft) return;
    resetSelection();
    setSelectedProduct(products.find((item) => item.id === draft.productId) ?? { id: draft.productId, name: draft.productName, categoryId: null, isActive: true });
    setModal("product-create");
  };

  const notifyError = (error: unknown) => toast.error(error instanceof Error ? error.message : "Request failed");

  const saveCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = categoryFormSchema.safeParse({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      businessId: tenant.businessId || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid category data");
      return;
    }
    try {
      const body = {
        name: parsed.data.name,
        description: parsed.data.description,
        businessId: tenant.businessId,
      };
      if (selectedCategory) await updateCategory.mutateAsync({ id: selectedCategory.id, ...body });
      else await createCategory.mutateAsync(body);
      toast.success("Category saved");
      closeModal();
    } catch (error) {
      notifyError(error);
    }
  };

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    // Enforce mandatory category selection
    const selectedCatId = form.categoryId.trim();
    if (!selectedCatId || selectedCatId === "NONE") {
      toast.error("Please select a category. Category is required to create a product.");
      return;
    }
    const parsed = productFormSchema.safeParse({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      categoryId: selectedCatId,
      businessId: tenant.businessId || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid product data");
      return;
    }
    try {
      const body = {
        name: parsed.data.name,
        description: parsed.data.description,
        categoryId: parsed.data.categoryId,
        businessId: tenant.businessId,
      };
      if (selectedProduct) await updateProduct.mutateAsync({ id: selectedProduct.id, ...body });
      else {
        const product = (await createProduct.mutateAsync({
          ...body,
          categoryId: body.categoryId,
        })) as Product;
        const next = { productId: product.id, productName: product.name };
        setIncompleteDraft(next);
        setSelectedProduct(product);
        setForm({ ...emptyForm, name: "Default" });
        toast.success("Product created. Add its first variant to finish.");
        return;
      }
      toast.success("Product saved");
      closeModal();
    } catch (error) {
      notifyError(error);
    }
  };

  const saveVariant = async (event: React.FormEvent) => {
    event.preventDefault();
    const productId = selectedProduct?.id ?? (modal === "product-create" ? draft?.productId : undefined);
    if (!productId) {
      toast.error("Please select a parent product");
      return;
    }
    const sellingPriceNum = form.sellingPrice !== "" ? Number(form.sellingPrice) : NaN;
    const costPriceNum = form.costPrice !== "" ? Number(form.costPrice) : null;
    const stockNum = form.stock !== "" ? Number(form.stock) : NaN;

    const parsed = variantFormSchema.safeParse({
      name: form.name.trim(),
      sku: form.sku.trim() || undefined,
      barcode: form.barcode.trim() || null,
      sellingPrice: sellingPriceNum,
      costPrice: costPriceNum,
      stock: stockNum,
      productId,
      businessId: tenant.businessId || undefined,
      locationId: tenant.locationId || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid variant data");
      return;
    }

    try {
      const body = {
        productId,
        name: parsed.data.name,
        sku: parsed.data.sku,
        barcode: parsed.data.barcode ?? null,
        sellingPrice: parsed.data.sellingPrice,
        costPrice: parsed.data.costPrice ?? null,
        businessId: tenant.businessId,
        locationId: tenant.locationId,
      };
      if (selectedVariant) {
        await updateVariant.mutateAsync({ id: selectedVariant.id, ...body });
        if (parsed.data.stock !== selectedVariant.stock) {
          await setStock.mutateAsync({
            id: selectedVariant.id,
            stock: parsed.data.stock,
            businessId: tenant.businessId,
            locationId: tenant.locationId,
          });
        }
      } else {
        await createVariant.mutateAsync({ ...body, stock: parsed.data.stock });
      }
      if (modal === "product-create") setIncompleteDraft(null);
      toast.success("Variant saved");
      closeModal();
    } catch (error) {
      notifyError(error);
    }
  };

  const saveStock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedVariant) return;
    const stockNum = form.stock !== "" ? Number(form.stock) : NaN;
    const parsed = adjustStockSchema.safeParse({
      stock: stockNum,
      operation: "set",
      locationId: tenant.locationId || undefined,
      businessId: tenant.businessId || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid stock count");
      return;
    }
    try {
      await setStock.mutateAsync({
        id: selectedVariant.id,
        stock: parsed.data.stock,
        businessId: tenant.businessId,
        locationId: tenant.locationId,
      });
      toast.success("Branch stock updated");
      closeModal();
    } catch (error) {
      notifyError(error);
    }
  };

  const openDeleteDialog = (title: string, itemName: string, action: () => Promise<unknown>) => {
    setDeleteTarget({ title, itemName, action });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteTarget.action();
      toast.success("Deleted successfully");
      setDeleteTarget(null);
    } catch (error) {
      notifyError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const openImages = (variant: Variant) => {
    resetSelection();
    setSelectedVariant(variant);
    setModal("images");
  };

  const uploadProfile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedVariant) return;
    try {
      const result = await setProfileImage.mutateAsync({
        variantId: selectedVariant.id,
        file,
        businessId: tenant.businessId,
      }) as { profileImageUrl?: string };
      if (result.profileImageUrl) {
        setSelectedVariant({ ...selectedVariant, profileImageUrl: result.profileImageUrl });
      }
      toast.success("Profile image updated");
    } catch (error) {
      notifyError(error);
    }
    event.target.value = "";
  };

  const uploadGallery = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length || !selectedVariant) return;
    try {
      await addImages.mutateAsync({
        variantId: selectedVariant.id,
        files,
        businessId: tenant.businessId,
      });
      await imagesQuery.refetch();
      toast.success("Gallery updated");
    } catch (error) {
      notifyError(error);
    }
    event.target.value = "";
  };

  const loading = categoriesQuery.isPending || productsQuery.isPending || variantsQuery.isPending;
  const failed = categoriesQuery.isError || productsQuery.isError || variantsQuery.isError;
  const retry = () => {
    void categoriesQuery.refetch();
    void productsQuery.refetch();
    void variantsQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalog"
        description="Manage product categories, variants, pricing, and inventory across your branches."
        actions={
          <>
            <Button variant="outline" onClick={() => openCategory()}>
              <Plus className="mr-2 h-4 w-4" />Category
            </Button>
            <Button onClick={() => openProduct()}>
              <PackagePlus className="mr-2 h-4 w-4" />Product
            </Button>
          </>
        }
      />

      {draft ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
          <span><strong>{draft.productName}</strong> exists but still needs its first variant.</span>
          <Button size="sm" onClick={resumeDraft}>Resume setup</Button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Products" value={String(metrics.products)} icon={PackagePlus} />
        <MetricCard label="Units in branch" value={String(metrics.units)} icon={PackagePlus} />
        <MetricCard label="Low stock SKUs" value={String(metrics.low)} icon={PackagePlus} />
        <MetricCard label="Inventory value" value={canViewCost ? formatBDT(metrics.value) : "Restricted"} icon={PackagePlus} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_240px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search product, variant, SKU, or barcode"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="All categories">
                {categoryId === "ALL"
                  ? "All categories"
                  : (categories.find((c) => c.id === categoryId)?.name ?? "All categories")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => openVariant(undefined, undefined)} disabled={!products.length}>
            <Plus className="mr-2 h-4 w-4" />Variant
          </Button>
        </div>
      </div>

      <DataState
        data={pageRows}
        isLoading={loading}
        isError={failed}
        resource="catalog"
        emptyTitle="No catalog variants found"
        emptyDescription="Create a product and its first variant to begin."
        onRetry={retry}
      >
        {(data) => (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <Table>
              <TableHeader className="bg-slate-50/70">
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Product / variant</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>SKU / barcode</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50/50">
                    <TableCell className="w-16 py-2">
                      <VariantImageCarousel
                        images={row.images}
                        alt={row.name || row.productName}
                        size="sm"
                        className="h-11 w-11 rounded-md border border-slate-200"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#070B28]">{row.productName}</span>
                        <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 font-normal text-slate-500">
                          {row.variantCount} {row.variantCount === 1 ? "variant" : "variants"}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500">{row.name || "Default"}</div>
                    </TableCell>
                    <TableCell>{row.categoryName || "Uncategorized"}</TableCell>
                    <TableCell>
                      <div className="font-mono text-xs">{row.sku}</div>
                      <div className="text-xs text-slate-500">{row.barcode || "—"}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-[#0052FF]">
                      {formatBDT(row.sellingPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={row.stock <= 5 ? "pending" : "outline"}>
                        {row.stock}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Edit variant" onClick={() => openVariant(row.rawVariant)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Set stock"
                          onClick={() => {
                            setSelectedVariant(row.rawVariant);
                            setForm({ ...emptyForm, stock: String(row.stock) });
                            setModal("stock");
                          }}
                        >
                          <PackagePlus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Manage images" onClick={() => openImages(row.rawVariant)}>
                          <ImagePlus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete variant"
                          onClick={() =>
                            openDeleteDialog(
                              "Delete Variant",
                              row.name || row.sku,
                              () => deleteVariant.mutateAsync({ id: row.id, businessId: tenant.businessId }),
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t border-slate-200 px-4 py-2">
              <DataPagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={rows.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
                itemLabel="variants"
              />
            </div>
          </div>
        )}
      </DataState>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-semibold text-[#070B28]">Categories</h2>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="font-medium text-[#070B28]">{category.name}</p>
                  <p className="text-xs text-slate-500">{category.description || "No description"}</p>
                </div>
                <div>
                  <Button variant="ghost" size="icon" title="Edit category" onClick={() => openCategory(category)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete category"
                    onClick={() =>
                      openDeleteDialog(
                        "Delete Category",
                        category.name,
                        () => deleteCategory.mutateAsync({ id: category.id, businessId: tenant.businessId }),
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-semibold text-[#070B28]">Products</h2>
          <div className="space-y-2">
            {products.map((product) => {
              const vCount = product.variants?.length ?? rows.filter((r) => r.productId === product.id).length;
              return (
                <div key={product.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[#070B28]">{product.name}</p>
                      <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 text-slate-600">
                        {vCount} {vCount === 1 ? "variant" : "variants"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">{product.category?.name || "Uncategorized"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" title="Edit product" onClick={() => openProduct(product)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Add variant" onClick={() => openVariant(undefined, product)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete product"
                      onClick={() =>
                        openDeleteDialog(
                          "Delete Product",
                          product.name,
                          () => deleteProduct.mutateAsync({ id: product.id, businessId: tenant.businessId }),
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Category Modal with Increased Title */}
      <Dialog open={modal === "category"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-[#070B28]">
              {selectedCategory ? "Edit category" : "Create category"}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={saveCategory}>
            <Input
              required
              maxLength={120}
              placeholder="Category name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              maxLength={500}
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <ModalActions close={closeModal} />
          </form>
        </DialogContent>
      </Dialog>

      {/* Product Modal with Increased Title */}
      <Dialog open={modal === "product-edit" || modal === "product-create"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-[#070B28]">
              {modal === "product-edit"
                ? "Edit product"
                : selectedProduct || draft
                  ? "Step 2 — first variant"
                  : "Step 1 — product"}
            </DialogTitle>
          </DialogHeader>
          {modal === "product-create" && (selectedProduct || draft) ? (
            <form className="space-y-4" onSubmit={saveVariant}>
              <VariantFields form={form} setForm={setForm} />
              <p className="text-xs text-slate-500">
                If this request fails, the created product ID is retained so setup can be resumed without creating a duplicate.
              </p>
              <ModalActions close={closeModal} label="Finish product" />
            </form>
          ) : (
            <form className="space-y-4" onSubmit={saveProduct}>
              <Input
                required
                maxLength={120}
                placeholder="Product name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                maxLength={500}
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Category <span className="text-rose-500">*</span>
                </label>
                <CategorySelect
                  categories={categories}
                  value={form.categoryId}
                  onChange={(value) => setForm({ ...form, categoryId: value })}
                />
              </div>
              <ModalActions close={closeModal} label={modal === "product-create" ? "Create & continue" : "Save"} />
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Variant Modal with Increased Title */}
      <Dialog open={modal === "variant"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-[#070B28]">
              {selectedVariant ? "Edit variant" : "Add variant"}{" "}
              {selectedProduct ? `— ${selectedProduct.name}` : ""}
            </DialogTitle>
          </DialogHeader>
          {!selectedProduct ? (
            <Select value="" onValueChange={(id) => setSelectedProduct(products.find((item) => item.id === id) ?? null)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <form className="space-y-4" onSubmit={saveVariant}>
            <VariantFields form={form} setForm={setForm} />
            <ModalActions close={closeModal} />
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock Modal with Increased Title */}
      <Dialog open={modal === "stock"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-[#070B28]">
              Set branch stock — {selectedVariant?.sku}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={saveStock}>
            <Input
              required
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
            <p className="text-xs text-slate-500">
              This sets the absolute stock for the selected branch and records an inventory adjustment.
            </p>
            <ModalActions close={closeModal} label="Update stock" />
          </form>
        </DialogContent>
      </Dialog>

      {/* Images Modal with Increased Title */}
      <Dialog open={modal === "images"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-[#070B28]">
              Images — {selectedVariant?.sku}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center rounded-md bg-[#0052FF] px-4 py-2 text-sm text-white hover:bg-[#0047E0] transition-colors">
                <ImagePlus className="mr-2 h-4 w-4" />Set profile
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={uploadProfile} />
              </label>
              <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 transition-colors">
                <Plus className="mr-2 h-4 w-4" />Add gallery
                <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={uploadGallery} />
              </label>
              {selectedVariant?.profileImageUrl ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    void deleteProfileImage
                      .mutateAsync({ variantId: selectedVariant.id, businessId: tenant.businessId })
                      .catch(notifyError)
                  }
                >
                  Remove profile
                </Button>
              ) : null}
            </div>
            {selectedVariant?.profileImageUrl ? (
              <div
                className="aspect-video w-full rounded-xl bg-slate-100 bg-cover bg-center border border-slate-200"
                role="img"
                aria-label="Variant profile"
                style={{ backgroundImage: `url("${encodeURI(selectedVariant.profileImageUrl)}")` }}
              />
            ) : null}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(imagesQuery.data ?? []).map((image) => (
                <div
                  key={image.id}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100 bg-cover bg-center border border-slate-200"
                  role="img"
                  aria-label="Variant gallery image"
                  style={{ backgroundImage: `url("${encodeURI(image.url)}")` }}
                >
                  <Button
                    className="absolute right-2 top-2 opacity-90"
                    variant="destructive"
                    size="icon"
                    onClick={() =>
                      selectedVariant &&
                      void deleteImage
                        .mutateAsync({ variantId: selectedVariant.id, imageId: image.id, businessId: tenant.businessId })
                        .then(() => imagesQuery.refetch())
                        .catch(notifyError)
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reusable Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget?.title}
        itemName={deleteTarget?.itemName}
        isDeleting={isDeleting}
        onConfirm={executeDelete}
      />
    </div>
  );
}

function ModalActions({ close, label = "Save" }: { close: () => void; label?: string }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="outline" onClick={close}>
        Cancel
      </Button>
      <Button type="submit" className="bg-[#0052FF] hover:bg-[#0047E0] text-white">
        {label}
      </Button>
    </div>
  );
}

function CategorySelect({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select category (Required)" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function VariantFields({ form, setForm }: { form: typeof emptyForm; setForm: (value: typeof emptyForm) => void }) {
  return (
    <>
      <Input
        required
        maxLength={120}
        placeholder="Variant name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          maxLength={64}
          placeholder="SKU (auto if empty)"
          value={form.sku}
          onChange={(e) => setForm({ ...form, sku: e.target.value })}
        />
        <Input
          maxLength={64}
          placeholder="Barcode"
          value={form.barcode}
          onChange={(e) => setForm({ ...form, barcode: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input
          required
          type="number"
          min="0"
          step="1"
          placeholder="Selling price"
          value={form.sellingPrice}
          onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
        />
        <Input
          type="number"
          min="0"
          step="1"
          placeholder="Cost price"
          value={form.costPrice}
          onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
        />
        <Input
          required
          type="number"
          min="0"
          step="1"
          placeholder="Stock"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
        />
      </div>
    </>
  );
}
