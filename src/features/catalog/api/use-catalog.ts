"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { apiClient } from "@/lib/api-client";
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

export function useCategories(scope: CatalogScope, enabled = true) {
  const userId = useCatalogUserId();
  return useQuery({ queryKey: catalogKeys.categories(userId, scope), queryFn: async ({ signal }) =>
    (await apiClient.get<Category[]>("/catalog/categories", { params: scope, signal })).data,
    enabled,
  });
}

export function useProducts(scope: CatalogScope, enabled = true) {
  const userId = useCatalogUserId();
  return useQuery({ queryKey: catalogKeys.products(userId, scope), queryFn: async ({ signal }) =>
    (await apiClient.get<Product[]>("/catalog/products", { params: scope, signal })).data,
    enabled,
  });
}

export function useVariants(scope: CatalogScope, enabled = true) {
  const userId = useCatalogUserId();
  return useQuery({ queryKey: catalogKeys.variants(userId, scope), queryFn: async ({ signal }) =>
    (await apiClient.get<Variant[]>("/catalog/variants", { params: scope, signal })).data,
    enabled,
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
  return useCatalogMutation(async ({ id, stock, businessId, locationId }: { id: string; stock: number; businessId?: string; locationId?: string }) =>
    (await apiClient.patch<Variant>(`/catalog/variants/${id}/stock`, { operation: "set", stock, businessId, locationId }, { params: { businessId } })).data,
  );
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
  (await apiClient.post(`/variants/${variantId}/profile-image`, imageForm("file", [file]), { params: { businessId }, headers: { "Content-Type": "multipart/form-data" } })).data,
);
export const useDeleteProfileImage = () => useCatalogMutation(async ({ variantId, businessId }: { variantId: string; businessId?: string }) =>
  (await apiClient.delete(`/variants/${variantId}/profile-image`, { params: { businessId } })).data,
);
export const useAddVariantImages = () => useCatalogMutation(async ({ variantId, files, businessId }: { variantId: string; files: File[]; businessId?: string }) =>
  (await apiClient.post<VariantImage[]>(`/variants/${variantId}/images`, imageForm("images", files), { params: { businessId }, headers: { "Content-Type": "multipart/form-data" } })).data,
);
export const useDeleteVariantImage = () => useCatalogMutation(async ({ variantId, imageId, businessId }: { variantId: string; imageId: string; businessId?: string }) =>
  (await apiClient.delete<VariantImage[]>(`/variants/${variantId}/images/${encodeURIComponent(imageId)}`, { params: { businessId } })).data,
);
