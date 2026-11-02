"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  ChevronDown,
  DollarSign,
  Filter,
  ImagePlus,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
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
import { createCatalogLookupMaps, mapVariantToCatalogRow } from "@/features/catalog/view-models";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import { useDebounce } from "@/hooks/use-debounce";
import { canViewSensitiveFinancialData } from "@/lib/permissions";
import { cn, formatBDT } from "@/lib/utils";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set());

  const toggleExpandCategory = (id: string) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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

  const { productMap, categoryMap } = useMemo(() => {
    return createCatalogLookupMaps(products, categories);
  }, [products, categories]);

  const variantCountsByProduct = useMemo(() => {
    const map = new Map<string, number>();
    const rawVariants = variantsQuery.data ?? [];
    for (const v of rawVariants) {
      if (v.productId) {
        map.set(v.productId, (map.get(v.productId) ?? 0) + 1);
      }
    }
    return map;
  }, [variantsQuery.data]);

  const productsWithoutVariants = useMemo(() => {
    return products.filter((p) => {
      const vCount =
        p.variantsCount ??
        p._count?.variants ??
        p.variants?.length ??
        variantCountsByProduct.get(p.id) ??
        0;
      return vCount === 0;
    });
  }, [products, variantCountsByProduct]);

  const activeCategoryFilter = useMemo(() => {
    if (categoryId === "ALL") return null;
    return categoryMap.get(categoryId) ?? null;
  }, [categoryMap, categoryId]);

  const rows = useMemo(() => (variantsQuery.data ?? [])
    .map((variant) => mapVariantToCatalogRow(variant, productMap, categoryMap))
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
    }), [categoryId, activeCategoryFilter, debouncedSearch, variantsQuery.data, productMap, categoryMap]);

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
    if (isSubmittingRef.current || createCategory.isPending || updateCategory.isPending) return;

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
      isSubmittingRef.current = true;
      setIsSubmitting(true);
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
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmittingRef.current || createProduct.isPending || updateProduct.isPending) return;

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
      isSubmittingRef.current = true;
      setIsSubmitting(true);
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
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const saveVariant = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmittingRef.current || createVariant.isPending || updateVariant.isPending || setStock.isPending) return;

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
      isSubmittingRef.current = true;
      setIsSubmitting(true);
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
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const saveStock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmittingRef.current || setStock.isPending || !selectedVariant) return;

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
      isSubmittingRef.current = true;
      setIsSubmitting(true);
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
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
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
        description="Manage categories, products, variants, pricing, and branch inventory."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => openCategory()}
              className="h-9 gap-1.5 text-xs font-medium border-slate-200"
            >
              <Plus className="h-4 w-4" /> New Category
            </Button>
            <Button
              onClick={() => openProduct()}
              className="bg-[#0052FF] text-white hover:bg-[#0047E0] h-9 gap-1.5 text-xs font-medium"
            >
              <PackagePlus className="h-4 w-4" /> New Product
            </Button>
          </>
        }
      />

      {productsWithoutVariants.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              {productsWithoutVariants.length === 1
                ? "1 product has no variants and cannot be sold at register:"
                : `${productsWithoutVariants.length} products have no variants and cannot be sold at register:`}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {productsWithoutVariants.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-md border border-amber-300 bg-white px-2.5 py-1 shadow-2xs"
              >
                <span className="font-medium text-slate-800">{p.name}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openVariant(undefined, p)}
                  className="h-6 px-2 text-[11px] font-semibold text-[#0052FF] border-blue-200 hover:bg-blue-50 cursor-pointer"
                >
                  <Plus className="mr-1 h-3 w-3" /> Add variant
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : draft ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
          <span><strong>{draft.productName}</strong> exists but still needs its first variant.</span>
          <Button size="sm" onClick={resumeDraft} className="h-8 text-xs">Resume setup</Button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Products" value={String(metrics.products)} icon={Package} />
        <MetricCard label="Units in branch" value={String(metrics.units)} icon={Boxes} />
        <MetricCard label="Low stock SKUs" value={String(metrics.low)} icon={AlertTriangle} />
        <MetricCard label="Inventory value" value={canViewCost ? formatBDT(metrics.value) : "Restricted"} icon={DollarSign} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
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
          <Button
            variant="outline"
            onClick={() => openVariant(undefined, undefined)}
            disabled={!products.length}
            className="h-10 gap-1.5 text-xs font-medium border-slate-200"
          >
            <Plus className="h-4 w-4" /> New Variant
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
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          title={`Edit variant ${row.name || row.sku}`}
                          aria-label={`Edit variant ${row.name || row.sku}`}
                          onClick={() => openVariant(row.rawVariant)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          title={`Set branch stock for ${row.name || row.sku}`}
                          aria-label={`Set branch stock for ${row.name || row.sku}`}
                          onClick={() => {
                            setSelectedVariant(row.rawVariant);
                            setForm({ ...emptyForm, stock: String(row.stock) });
                            setModal("stock");
                          }}
                        >
                          <PackagePlus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          title={`Manage images for ${row.name || row.sku}`}
                          aria-label={`Manage images for ${row.name || row.sku}`}
                          onClick={() => openImages(row.rawVariant)}
                        >
                          <ImagePlus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title={`Delete variant ${row.name || row.sku}`}
                          aria-label={`Delete variant ${row.name || row.sku}`}
                          onClick={() =>
                            openDeleteDialog(
                              "Delete Variant",
                              row.name || row.sku,
                              () => deleteVariant.mutateAsync({ id: row.id, businessId: tenant.businessId }),
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
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

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* Categories Section with Compact Hierarchy & Progressive Disclosure */}
        <section className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#070B28]">Categories</h2>
              <Badge variant="outline" className="text-xs font-normal text-slate-500 py-0 px-2">
                {categories.length} {categories.length === 1 ? "category" : "categories"}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openCategory()}
              className="h-8 gap-1.5 text-xs font-medium border-slate-200"
            >
              <Plus className="h-3.5 w-3.5" /> New Category
            </Button>
          </div>

          <div className="p-4 space-y-3">
            {categories.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-medium text-slate-700">No categories created yet</p>
                <p className="text-xs text-slate-400 mt-1">Click &quot;New Category&quot; above to add your first category.</p>
              </div>
            ) : (
              categories.map((category) => {
                const pCount = category.productsCount ?? category._count?.products ?? 0;
                const skus = category.activeSkus ?? 0;
                const units = category.totalUnits ?? 0;
                const invValue = category.inventoryValue ?? 0;
                const sCount = category.salesCount ?? 0;
                const sRevenue = category.salesRevenue ?? 0;
                const isSelected = categoryId === category.id;
                const isExpanded = expandedCategoryIds.has(category.id);

                // Truthful Stock Health & Status rules (below 5 is critical):
                let stockLabel = "No inventory items";
                let stockBadgeClass = "border-slate-200 bg-slate-50 text-slate-600";
                let healthText = "text-slate-500";
                let hasStockBar = false;
                let healthBarBg = "bg-slate-400";
                let healthPercent = 0;

                if (skus === 0 && pCount === 0) {
                  stockLabel = "No inventory items";
                  stockBadgeClass = "border-slate-200 bg-slate-50 text-slate-600";
                  healthText = "text-slate-500";
                  hasStockBar = false;
                } else if (skus === 0 && pCount > 0) {
                  stockLabel = "No variants";
                  stockBadgeClass = "border-slate-200 bg-slate-50 text-slate-600";
                  healthText = "text-slate-500";
                  hasStockBar = false;
                } else if (units === 0) {
                  stockLabel = "Out of Stock";
                  stockBadgeClass = "border-rose-200 bg-rose-50 text-rose-700 font-semibold";
                  healthText = "text-rose-600 font-semibold";
                  hasStockBar = true;
                  healthBarBg = "bg-rose-500";
                  healthPercent = 5;
                } else if (units < 5) {
                  stockLabel = "Critical Stock (< 5)";
                  stockBadgeClass = "border-rose-200 bg-rose-50 text-rose-700 font-semibold";
                  healthText = "text-rose-600 font-semibold";
                  hasStockBar = true;
                  healthBarBg = "bg-rose-500";
                  healthPercent = Math.max(12, Math.round((units / 5) * 20));
                } else if (units < 15) {
                  stockLabel = "Low Stock";
                  stockBadgeClass = "border-amber-200 bg-amber-50 text-amber-700 font-medium";
                  healthText = "text-amber-600 font-medium";
                  hasStockBar = true;
                  healthBarBg = "bg-amber-500";
                  healthPercent = Math.min(50, Math.max(25, Math.round(20 + ((units - 5) / 10) * 30)));
                } else if (units < 50) {
                  stockLabel = "Healthy Stock";
                  stockBadgeClass = "border-emerald-200 bg-emerald-50 text-emerald-700 font-medium";
                  healthText = "text-emerald-700 font-medium";
                  hasStockBar = true;
                  healthBarBg = "bg-emerald-500";
                  healthPercent = Math.min(85, Math.max(55, Math.round(50 + ((units - 15) / 35) * 35)));
                } else {
                  stockLabel = "Well Stocked";
                  stockBadgeClass = "border-emerald-200 bg-emerald-50 text-emerald-700 font-medium";
                  healthText = "text-emerald-700 font-medium";
                  hasStockBar = true;
                  healthBarBg = "bg-emerald-500";
                  healthPercent = 100;
                }

                return (
                  <div
                    key={category.id}
                    className={cn(
                      "group rounded-lg border transition-all duration-150",
                      isSelected
                        ? "border-[#0052FF] bg-blue-50/15 ring-1 ring-[#0052FF]/40 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 shadow-xs"
                    )}
                  >
                    <div className="p-3.5 sm:p-4">
                      {/* Main Collapsed Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <h3 className="font-semibold text-sm text-[#070B28] truncate">{category.name}</h3>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs font-normal py-0 px-2 shrink-0",
                                category.status === "ACTIVE" || category.isActive !== false
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 bg-slate-50 text-slate-500"
                              )}
                            >
                              {category.status ?? (category.isActive !== false ? "ACTIVE" : "INACTIVE")}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn("text-xs font-normal py-0 px-2 shrink-0", stockBadgeClass)}
                            >
                              {stockLabel}
                            </Badge>
                          </div>

                          {category.description ? (
                            <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                              {category.description}
                            </p>
                          ) : null}

                          {/* Compact summary line */}
                          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                            <span>
                              <strong className="font-semibold text-slate-700">{pCount}</strong> {pCount === 1 ? "product" : "products"}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span>
                              <strong className="font-semibold text-slate-700">{skus}</strong> {skus === 1 ? "SKU" : "SKUs"}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span>
                              <strong
                                className={cn(
                                  "font-semibold font-mono",
                                  skus > 0 && units < 5
                                    ? "text-rose-600"
                                    : skus > 0 && units < 15
                                      ? "text-amber-600"
                                      : "text-slate-700"
                                )}
                              >
                                {units}
                              </strong>{" "}
                              {units === 1 ? "unit" : "units"}
                            </span>
                            {canViewCost && invValue > 0 ? (
                              <>
                                <span className="text-slate-300">·</span>
                                <span className="font-mono text-slate-600">{formatBDT(invValue)}</span>
                              </>
                            ) : null}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              "h-8 px-2.5 text-xs font-medium gap-1",
                              isSelected
                                ? "bg-[#0052FF] text-white hover:bg-[#0047E0]"
                                : "border-slate-200 text-slate-700 hover:bg-slate-50"
                            )}
                            title={isSelected ? "Active filter. Click to clear filter." : `Filter catalog by ${category.name}`}
                            aria-label={isSelected ? `Clear filter for ${category.name}` : `Filter catalog by ${category.name}`}
                            onClick={() => setCategoryId(isSelected ? "ALL" : category.id)}
                          >
                            <Filter className="h-3 w-3" />
                            <span className="hidden sm:inline">{isSelected ? "Filtering" : "Filter"}</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            title={`Edit category ${category.name}`}
                            aria-label={`Edit category ${category.name}`}
                            onClick={() => openCategory(category)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title={`Delete category ${category.name}`}
                            aria-label={`Delete category ${category.name}`}
                            onClick={() =>
                              openDeleteDialog(
                                "Delete Category",
                                category.name,
                                () => deleteCategory.mutateAsync({ id: category.id, businessId: tenant.businessId }),
                              )
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            title={isExpanded ? "Collapse details" : "Expand details"}
                            aria-label={isExpanded ? `Collapse details for ${category.name}` : `Expand details for ${category.name}`}
                            aria-expanded={isExpanded}
                            onClick={() => toggleExpandCategory(category.id)}
                          >
                            <ChevronDown
                              className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")}
                            />
                          </Button>
                        </div>
                      </div>

                      {/* Width Health Bar for Stock Counts */}
                      {hasStockBar ? (
                        <div className="mt-2.5 rounded-md border border-slate-100 bg-slate-50/70 p-2">
                          <div className="mb-1 flex items-center justify-between text-[11px]">
                            <span className="flex items-center gap-1.5 font-medium text-slate-700">
                              <span className={cn("h-2 w-2 rounded-full", healthBarBg)} />
                              Stock Health
                            </span>
                            <span className={cn("text-xs font-medium", healthText)}>
                              {stockLabel} ({units} {units === 1 ? "unit" : "units"})
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={cn("h-full rounded-full transition-all duration-300", healthBarBg)}
                              style={{ width: `${healthPercent}%` }}
                            />
                          </div>
                        </div>
                      ) : null}

                      {/* Progressive Disclosure: Details */}
                      <AnimatePresence initial={false}>
                        {isExpanded ? (
                          <motion.div
                            key="category-expanded-details"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3.5 pt-3.5 border-t border-slate-100 space-y-3">
                              {category.description ? (
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {category.description}
                                </p>
                              ) : null}

                              {category.slug ? (
                                <div className="text-[11px] text-slate-400 font-mono">
                                  Slug: /{category.slug}
                                </div>
                              ) : null}

                              {/* Key/Value Metric Grid */}
                              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                                <div className="rounded-md border border-slate-100 bg-slate-50/50 p-2">
                                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">Catalog</span>
                                  <span className="font-semibold text-slate-800 text-xs">
                                    {pCount} <span className="text-slate-400 font-normal">({skus} SKUs)</span>
                                  </span>
                                </div>
                                <div className="rounded-md border border-slate-100 bg-slate-50/50 p-2">
                                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">Branch Units</span>
                                  <span className="font-mono font-semibold text-slate-800 text-xs">{units}</span>
                                </div>
                                <div className="rounded-md border border-slate-100 bg-slate-50/50 p-2">
                                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">Inventory Value</span>
                                  <span className="font-mono font-semibold text-[#070B28] text-xs">
                                    {canViewCost ? formatBDT(invValue) : "Restricted"}
                                  </span>
                                </div>
                                <div className="rounded-md border border-slate-100 bg-slate-50/50 p-2">
                                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">Sales Traction</span>
                                  <span className="font-mono font-semibold text-emerald-700 text-xs">
                                    {sCount} sold {sRevenue > 0 ? `(${formatBDT(sRevenue)})` : ""}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Products Section (Clean & Aligned) */}
        <section className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#070B28]">Products</h2>
              <Badge variant="outline" className="text-xs font-normal text-slate-500 py-0 px-2">
                {products.length} {products.length === 1 ? "product" : "products"}
              </Badge>
            </div>
            <Button
              size="sm"
              onClick={() => openProduct()}
              className="bg-[#0052FF] text-white hover:bg-[#0047E0] h-8 gap-1.5 text-xs font-medium"
            >
              <PackagePlus className="h-3.5 w-3.5" /> New Product
            </Button>
          </div>

          <div className="p-4 space-y-3">
            {products.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-medium text-slate-700">No products created yet</p>
                <p className="text-xs text-slate-400 mt-1">Click &quot;New Product&quot; above to create your first product.</p>
              </div>
            ) : (
              products.map((product) => {
                const vCount =
                  product.variantsCount ??
                  product._count?.variants ??
                  product.variants?.length ??
                  variantCountsByProduct.get(product.id) ??
                  0;

                return (
                  <div
                    key={product.id}
                    className="rounded-lg border border-slate-200 bg-white p-3.5 sm:p-4 hover:border-slate-300 hover:bg-slate-50/30 transition-all duration-150 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <p className="font-semibold text-sm text-[#070B28] truncate">{product.name}</p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-normal py-0 px-2 shrink-0",
                              vCount === 0
                                ? "border-amber-300 bg-amber-50 text-amber-800 font-semibold"
                                : "border-slate-200 bg-slate-50 text-slate-700 font-mono"
                            )}
                          >
                            {vCount === 0 ? "Needs variant" : `${vCount} ${vCount === 1 ? "variant" : "variants"}`}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-slate-500">
                          <span className="font-medium text-slate-700">
                            {product.category?.name || "Uncategorized"}
                          </span>
                          {product.description ? (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="text-slate-500 line-clamp-1 max-w-sm">
                                {product.description}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex shrink-0 items-center gap-1">
                        {vCount === 0 ? (
                          <Button
                            size="sm"
                            onClick={() => openVariant(undefined, product)}
                            className="h-8 px-2.5 text-xs font-medium bg-[#0052FF] text-white hover:bg-[#0047E0] gap-1 cursor-pointer"
                            title={`Add first variant for ${product.name}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add variant</span>
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#0052FF] hover:bg-blue-50"
                            title={`Add variant to ${product.name}`}
                            aria-label={`Add variant to ${product.name}`}
                            onClick={() => openVariant(undefined, product)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          title={`Edit product ${product.name}`}
                          aria-label={`Edit product ${product.name}`}
                          onClick={() => openProduct(product)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title={`Delete product ${product.name}`}
                          aria-label={`Delete product ${product.name}`}
                          onClick={() =>
                            openDeleteDialog(
                              "Delete Product",
                              product.name,
                              () => deleteProduct.mutateAsync({ id: product.id, businessId: tenant.businessId }),
                            )
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
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
            <ModalActions
              close={closeModal}
              label={selectedCategory ? "Save category" : "Create category"}
              isLoading={isSubmitting || createCategory.isPending || updateCategory.isPending}
            />
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
              <ModalActions
                close={closeModal}
                label="Finish product"
                isLoading={isSubmitting || createVariant.isPending || updateVariant.isPending}
              />
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
              <ModalActions
                close={closeModal}
                label={modal === "product-create" ? "Create & continue" : "Save"}
                isLoading={isSubmitting || createProduct.isPending || updateProduct.isPending}
              />
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
            <ModalActions
              close={closeModal}
              label={selectedVariant ? "Save variant" : "Add variant"}
              isLoading={isSubmitting || createVariant.isPending || updateVariant.isPending || setStock.isPending}
            />
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
              step="1"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
            <p className="text-xs text-slate-500">
              This sets the absolute stock for the selected branch and records an inventory adjustment.
            </p>
            <ModalActions
              close={closeModal}
              label="Update stock"
              isLoading={isSubmitting || setStock.isPending}
            />
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

function ModalActions({
  close,
  label = "Save",
  isLoading = false,
}: {
  close: () => void;
  label?: string;
  isLoading?: boolean;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="outline" onClick={close} disabled={isLoading}>
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={isLoading}
        loading={isLoading}
        className="bg-[#0052FF] hover:bg-[#0047E0] text-white"
      >
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
          step="1"
          placeholder="Stock"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
        />
      </div>
    </>
  );
}
