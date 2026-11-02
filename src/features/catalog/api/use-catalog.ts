"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { apiClient } from "@/lib/api-client";
import { createIdempotencyKey, idempotencyHeaders } from "@/lib/idempotency";
import type { RootState } from "@/redux/types";
import type { Category, Product, Variant, VariantImage } from "@/types/domain";

export interface CatalogScope { businessId?: string; locationId?: string }
export interface CategoryInput { name: string; description?: string; businessId?: string }
export interface ProductInput {
  name: string;
  description?: string;
  categoryId?: string | null;
  customAttributes?: Array<{ key: string; value: string }>;
  businessId?: string;
}
export interface VariantInput {
  productId: string;
  name: string;
  sku?: string;
  barcode?: string | null;
  sellingPrice: number;
  costPrice?: number | null;
  stock?: number;
  businessId?: string;
  locationId?: string;
}

export const catalogKeys = {
  all: ["catalog"] as const,
  categories: (userId: string, scope: CatalogScope) => ["catalog", userId, "categories", scope] as const,
  products: (userId: string, scope: CatalogScope) => ["catalog", userId, "products", scope] as const,
  variants: (userId: string, scope: CatalogScope) => ["catalog", userId, "variants", scope] as const,
  images: (userId: string, variantId: string, businessId?: string) => ["catalog", userId, "images", variantId, businessId] as const,
};

function useCatalogUserId() {
  return useSelector((state: RootState) => state.auth.user?.id ?? "anonymous");
}

function useCatalogRole() {
  return useSelector((state: RootState) => state.auth.user?.role);
}

function isScopeReadyForRole(role?: string, scope?: CatalogScope): boolean {
  if (role === "ADMIN") {
    // Admin must provide both businessId and locationId before hitting branch-scoped catalog APIs
    return Boolean(scope?.businessId && scope?.locationId);
  }
  if (role === "CASHIER") {
    // Cashier hits API directly; business and branch are locked by token
    return true;
  }
  return true;
}

function isCategoryScopeReadyForRole(role?: string, scope?: CatalogScope): boolean {
  if (role === "ADMIN") {
    // Categories belong to the business; businessId is required for Admin
    return Boolean(scope?.businessId);
  }
  // Cashier and SuperAdmin hit directly
  return true;
}

export function useCategories(scope: CatalogScope, enabled = true) {
  const userId = useCatalogUserId();
  const role = useCatalogRole();
  const ready = isCategoryScopeReadyForRole(role, scope);
  return useQuery({
    queryKey: catalogKeys.categories(userId, scope),
    queryFn: async ({ signal }) =>
      (await apiClient.get<Category[]>("/catalog/categories", { params: scope, signal })).data,
    enabled: enabled && ready,
    staleTime: 10 * 60 * 1000, // 10 minutes (master category taxonomy changes infrequently)
    gcTime: 30 * 60 * 1000,
  });
}

export function useProducts(scope: CatalogScope, enabled = true) {
  const userId = useCatalogUserId();
  const role = useCatalogRole();
  const ready = isScopeReadyForRole(role, scope);
  return useQuery({
    queryKey: catalogKeys.products(userId, scope),
    queryFn: async ({ signal }) =>
      (await apiClient.get<Product[]>("/catalog/products", { params: scope, signal })).data,
    enabled: enabled && ready,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 20 * 60 * 1000,
  });
}

export function useVariants(scope: CatalogScope, enabled = true) {
  const userId = useCatalogUserId();
  const role = useCatalogRole();
  const ready = isScopeReadyForRole(role, scope);
  return useQuery({
    queryKey: catalogKeys.variants(userId, scope),
    queryFn: async ({ signal }) =>
      (await apiClient.get<Variant[]>("/catalog/variants", { params: scope, signal })).data,
    enabled: enabled && ready,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000,
  });
}

export interface InfiniteVariantsParams extends CatalogScope {
  search?: string;
  categoryId?: string;
  limit?: number;
}

export function useInfiniteVariants(
  params: InfiniteVariantsParams,
  enabled = true,
) {
  const userId = useCatalogUserId();
  const role = useCatalogRole();
  const ready = isScopeReadyForRole(role, params);
  const pageSize = params.limit ?? 30;

  return useInfiniteQuery({
    queryKey: [
      "catalog",
      userId,
      "infinite-variants",
      params.businessId,
      params.locationId,
      params.categoryId,
      params.search,
      pageSize,
    ],
    queryFn: async ({ pageParam = 1, signal }) => {
      const queryParams: Record<string, string | number | undefined> = {
        page: pageParam,
        limit: pageSize,
      };
      if (params.businessId) queryParams.businessId = params.businessId;
      if (params.locationId) queryParams.locationId = params.locationId;
      if (params.categoryId && params.categoryId !== "ALL") {
        queryParams.categoryId = params.categoryId;
      }
      if (params.search?.trim()) {
        queryParams.search = params.search.trim();
      }

      const res = await apiClient.get<Variant[]>("/catalog/variants", {
        params: queryParams,
        signal,
      });
      return res.data ?? [];
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (!lastPage || lastPage.length < pageSize) {
        return undefined;
      }
      return (lastPageParam as number) + 1;
    },
    enabled: enabled && ready,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000,
  });
}

export interface ProductSummary {
  products: number;
  units: number;
  unitsInBranch: number;
  lowStock: number;
  lowStockSkus: number;
  inventoryValue: number;
  value: number;
  currency: string;
}

export function useProductSummary(scope: CatalogScope, enabled = true) {
  const userId = useCatalogUserId();
  const role = useCatalogRole();
  const ready = isScopeReadyForRole(role, scope);
  return useQuery({
    queryKey: ["catalog", userId, "products-summary", scope] as const,
    queryFn: async ({ signal }) =>
      (await apiClient.get<ProductSummary>("/catalog/products/summary", { params: scope, signal })).data,
    enabled: enabled && ready,
  });
}

function useCatalogMutation<T>(fn: (variables: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  const userId = useCatalogUserId();
  return useMutation({ mutationFn: fn, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalog", userId] }) });
}

export const useCreateCategory = () => useCatalogMutation(async (body: CategoryInput) => (await apiClient.post<Category>("/catalog/categories", body)).data);
export const useUpdateCategory = () => useCatalogMutation(async ({ id, ...body }: CategoryInput & { id: string }) => (await apiClient.patch<Category>(`/catalog/categories/${id}`, body, { params: { businessId: body.businessId } })).data);
export const useDeleteCategory = () => useCatalogMutation(async ({ id, businessId }: { id: string; businessId?: string }) => (await apiClient.delete(`/catalog/categories/${id}`, { params: { businessId } })).data);
export const useCreateProduct = () => useCatalogMutation(async (body: ProductInput) => (await apiClient.post<Product>("/catalog/products", body)).data);
export const useUpdateProduct = () => useCatalogMutation(async ({ id, ...body }: ProductInput & { id: string }) => (await apiClient.patch<Product>(`/catalog/products/${id}`, body, { params: { businessId: body.businessId } })).data);
export const useDeleteProduct = () => useCatalogMutation(async ({ id, businessId }: { id: string; businessId?: string }) => (await apiClient.delete(`/catalog/products/${id}`, { params: { businessId } })).data);
export const useCreateVariant = () => useCatalogMutation(async (body: VariantInput) => (await apiClient.post<Variant>("/catalog/variants", body)).data);
export const useUpdateVariant = () => useCatalogMutation(async ({ id, ...body }: Partial<VariantInput> & { id: string }) => (await apiClient.patch<Variant>(`/catalog/variants/${id}`, body, { params: { businessId: body.businessId } })).data);
export const useDeleteVariant = () => useCatalogMutation(async ({ id, businessId }: { id: string; businessId?: string }) => (await apiClient.delete(`/catalog/variants/${id}`, { params: { businessId } })).data);

export function useSetStock() {
  return useCatalogMutation(async ({ id, stock, businessId, locationId, idempotencyKey }: { id: string; stock: number; businessId?: string; locationId?: string; idempotencyKey?: string }) => {
    const key = idempotencyKey || createIdempotencyKey();
    return (await apiClient.patch<Variant>(
      `/catalog/variants/${id}/stock`,
      { operation: "set", stock, businessId, locationId },
      { params: { businessId }, headers: idempotencyHeaders(key) },
    )).data;
  });
}

export function useVariantImages(variantId?: string, businessId?: string) {
  const userId = useCatalogUserId();
  return useQuery({ queryKey: catalogKeys.images(userId, variantId ?? "none", businessId), queryFn: async ({ signal }) =>
    (await apiClient.get<VariantImage[]>(`/variants/${variantId}/images`, { params: { businessId }, signal })).data,
    enabled: Boolean(variantId),
  });
}

function imageForm(field: "file" | "images", files: File[]) {
  const form = new FormData();
  files.forEach((file) => form.append(field, file));
  return form;
}

export const useSetProfileImage = () => useCatalogMutation(async ({ variantId, file, businessId }: { variantId: string; file: File; businessId?: string }) =>
  (await apiClient.post(`/variants/${variantId}/profile-image`, imageForm("file", [file]), { params: { businessId } })).data,
);
export const useDeleteProfileImage = () => useCatalogMutation(async ({ variantId, businessId }: { variantId: string; businessId?: string }) =>
  (await apiClient.delete(`/variants/${variantId}/profile-image`, { params: { businessId } })).data,
);
export const useAddVariantImages = () => useCatalogMutation(async ({ variantId, files, businessId }: { variantId: string; files: File[]; businessId?: string }) =>
  (await apiClient.post<VariantImage[]>(`/variants/${variantId}/images`, imageForm("images", files), { params: { businessId } })).data,
);
export const useDeleteVariantImage = () => useCatalogMutation(async ({ variantId, imageId, businessId }: { variantId: string; imageId: string; businessId?: string }) =>
  (await apiClient.delete<VariantImage[]>(`/variants/${variantId}/images/${encodeURIComponent(imageId)}`, { params: { businessId } })).data,
);
