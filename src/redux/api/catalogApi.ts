"use client";

import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { baseApi } from "@/redux/api/baseApi";
import type { Category, Product, Variant } from "@/types/domain";

export const catalogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    categories: builder.query<Category[], void>({
      query: () => ({ url: "/catalog/categories" }),
      queryKey: () => queryKeys.catalog.categories,
      providesTags: ["Category"],
    }),
    createCategory: builder.mutation<Category, { name: string }>({
      query: (data) => ({ url: "/catalog/categories", method: "POST", data }),
      invalidatesTags: ["Category"],
    }),
    products: builder.query<Product[], { search?: string; categoryId?: string } | void>({
      query: (params) => ({
        url: "/catalog/products",
        params: params ? (params as Record<string, unknown>) : undefined,
      }),
      queryKey: (params) => queryKeys.catalog.products(params as Record<string, unknown> | undefined),
      providesTags: ["Product"],
    }),
    createProduct: builder.mutation<Product, { name: string; categoryId: string }>({
      query: (data) => ({ url: "/catalog/products", method: "POST", data }),
      invalidatesTags: ["Product"],
    }),
    variants: builder.query<Variant[], string>({
      query: (productId) => ({ url: `/catalog/products/${productId}/variants` }),
      queryKey: (productId) => queryKeys.catalog.variants(productId),
      providesTags: (_result, productId) => [{ type: "Variant", id: productId }, "Variant"],
    }),
    createVariant: builder.mutation<
      Variant,
      { productId: string; name: string; sku: string; barcode: string; price: number }
    >({
      query: ({ productId, ...data }) => ({
        url: `/catalog/products/${productId}/variants`,
        method: "POST",
        data,
      }),
      invalidatesTags: ["Variant", "Product"],
    }),
    updateVariant: builder.mutation<
      Variant,
      { id: string; productId: string; name: string; sku: string; barcode: string; price: number }
    >({
      query: ({ id, productId, ...data }) => ({
        url: `/catalog/variants/${id}`,
        method: "PATCH",
        data: { ...data, productId },
      }),
      invalidatesTags: ["Variant", "Product"],
    }),
    searchVariants: builder.query<Variant[], { search?: string; categoryId?: string }>({
      query: (params) => ({
        url: "/catalog/variants",
        params: params as Record<string, unknown>,
      }),
      queryKey: (params) => ["catalog", "variant-search", params] as const,
      providesTags: ["Variant"],
    }),
  }),
});

type Injected = typeof catalogApi & {
  useCategoriesQuery: (
    arg?: void,
    options?: Omit<UseQueryOptions<Category[], Error>, "queryKey" | "queryFn">,
  ) => ReturnType<typeof useQuery<Category[], Error>>;
  useCreateCategoryMutation: (
    options?: UseMutationOptions<Category, Error, { name: string }>,
  ) => ReturnType<typeof useMutation<Category, Error, { name: string }>>;
  useProductsQuery: (
    arg?: { search?: string; categoryId?: string },
    options?: Omit<UseQueryOptions<Product[], Error>, "queryKey" | "queryFn">,
  ) => ReturnType<typeof useQuery<Product[], Error>>;
  useCreateProductMutation: (
    options?: UseMutationOptions<Product, Error, { name: string; categoryId: string }>,
  ) => ReturnType<typeof useMutation<Product, Error, { name: string; categoryId: string }>>;
  useVariantsQuery: (
    productId: string,
    options?: Omit<UseQueryOptions<Variant[], Error>, "queryKey" | "queryFn">,
  ) => ReturnType<typeof useQuery<Variant[], Error>>;
  useCreateVariantMutation: (
    options?: UseMutationOptions<
      Variant,
      Error,
      { productId: string; name: string; sku: string; barcode: string; price: number }
    >,
  ) => ReturnType<
    typeof useMutation<
      Variant,
      Error,
      { productId: string; name: string; sku: string; barcode: string; price: number }
    >
  >;
  useUpdateVariantMutation: (
    options?: UseMutationOptions<
      Variant,
      Error,
      { id: string; productId: string; name: string; sku: string; barcode: string; price: number }
    >,
  ) => ReturnType<
    typeof useMutation<
      Variant,
      Error,
      { id: string; productId: string; name: string; sku: string; barcode: string; price: number }
    >
  >;
  useSearchVariantsQuery: (
    arg: { search?: string; categoryId?: string },
    options?: Omit<UseQueryOptions<Variant[], Error>, "queryKey" | "queryFn">,
  ) => ReturnType<typeof useQuery<Variant[], Error>>;
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
