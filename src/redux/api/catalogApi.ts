"use client";

import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys, type QueryScope } from "@/lib/query-keys";
import { baseApi } from "@/redux/api/baseApi";
import type { Category, Product, Variant } from "@/types/domain";

type CatalogFilters = QueryScope & { search?: string; categoryId?: string; productId?: string; page?: number; limit?: number };
type VariantInput = { productId: string; name?: string; sku: string; barcode?: string; sellingPrice: number; stock?: number; isActive?: boolean };

export const catalogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    categories: builder.query<Category[], CatalogFilters | void>({
      query: (params) => ({ url: "/catalog/categories", params: params || undefined }),
      queryKey: (params) => queryKeys.catalog.categories(params || undefined),
      providesTags: ["Category"],
    }),
    createCategory: builder.mutation<Category, { name: string; description?: string }>({
      query: (data) => ({ url: "/catalog/categories", method: "POST", data }),
      invalidatesTags: ["Category"],
    }),
    products: builder.query<Product[], CatalogFilters | void>({
      query: (params) => ({ url: "/catalog/products", params: params || undefined }),
      queryKey: (params) => queryKeys.catalog.products(params || undefined, params || undefined),
      providesTags: ["Product"],
    }),
    createProduct: builder.mutation<Product, { name: string; categoryId: string; brand?: string }>({
      query: (data) => ({ url: "/catalog/products", method: "POST", data }),
      invalidatesTags: ["Product"],
    }),
    variants: builder.query<Variant[], CatalogFilters | void>({
      query: (params) => ({ url: "/catalog/variants", params: params || undefined }),
      queryKey: (params) => queryKeys.catalog.variants(params || undefined, params || undefined),
      providesTags: ["Variant"],
    }),
    createVariant: builder.mutation<Variant, VariantInput>({
      query: (data) => ({ url: "/catalog/variants", method: "POST", data }),
      invalidatesTags: ["Variant", "Product"],
    }),
    updateVariant: builder.mutation<Variant, VariantInput & { id: string }>({
      query: ({ id, ...data }) => ({ url: `/catalog/variants/${id}`, method: "PATCH", data }),
      invalidatesTags: ["Variant", "Product"],
    }),
    searchVariants: builder.query<Variant[], CatalogFilters>({
      query: (params) => ({ url: "/catalog/variants", params }),
      queryKey: (params) => queryKeys.catalog.variants(params, params),
      providesTags: ["Variant"],
    }),
  }),
});

type Injected = typeof catalogApi & {
  useCategoriesQuery: (arg?: CatalogFilters, options?: Omit<UseQueryOptions<Category[], Error>, "queryKey" | "queryFn">) => ReturnType<typeof useQuery<Category[], Error>>;
  useCreateCategoryMutation: (options?: UseMutationOptions<Category, Error, { name: string; description?: string }>) => ReturnType<typeof useMutation<Category, Error, { name: string; description?: string }>>;
  useProductsQuery: (arg?: CatalogFilters, options?: Omit<UseQueryOptions<Product[], Error>, "queryKey" | "queryFn">) => ReturnType<typeof useQuery<Product[], Error>>;
  useCreateProductMutation: (options?: UseMutationOptions<Product, Error, { name: string; categoryId: string; brand?: string }>) => ReturnType<typeof useMutation<Product, Error, { name: string; categoryId: string; brand?: string }>>;
  useVariantsQuery: (arg?: CatalogFilters, options?: Omit<UseQueryOptions<Variant[], Error>, "queryKey" | "queryFn">) => ReturnType<typeof useQuery<Variant[], Error>>;
  useCreateVariantMutation: (options?: UseMutationOptions<Variant, Error, VariantInput>) => ReturnType<typeof useMutation<Variant, Error, VariantInput>>;
  useUpdateVariantMutation: (options?: UseMutationOptions<Variant, Error, VariantInput & { id: string }>) => ReturnType<typeof useMutation<Variant, Error, VariantInput & { id: string }>>;
  useSearchVariantsQuery: (arg: CatalogFilters, options?: Omit<UseQueryOptions<Variant[], Error>, "queryKey" | "queryFn">) => ReturnType<typeof useQuery<Variant[], Error>>;
};

const typed = catalogApi as Injected;
export const useCategoriesQuery = typed.useCategoriesQuery;
export const useCreateCategoryMutation = typed.useCreateCategoryMutation;
export const useProductsQuery = typed.useProductsQuery;
export const useCreateProductMutation = typed.useCreateProductMutation;
export const useVariantsQuery = typed.useVariantsQuery;
export const useCreateVariantMutation = typed.useCreateVariantMutation;
export const useUpdateVariantMutation = typed.useUpdateVariantMutation;
export const useSearchVariantsQuery = typed.useSearchVariantsQuery;
