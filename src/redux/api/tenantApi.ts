"use client";

import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import { baseApi } from "@/redux/api/baseApi";

export interface LocationItem {
  id: string;
  businessId: string;
  name: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessApiItem {
  id: string;
  name: string;
  ownerId: string;
  profileImageUrl: string | null;
  profileImagePublicId: string | null;
  profileImageKey: string | null;
  createdAt: string;
  updatedAt: string;
  locations: LocationItem[];
}

export interface GetLocationsParams {
  businessId?: string;
  locationId?: string;
  search?: string;
}

export interface CreateLocationBody {
  name: string;
  address?: string;
  businessId?: string;
}

export interface UpdateLocationBody {
  id: string;
  name?: string;
  address?: string;
}

export interface CreateBusinessBody {
  name: string;
}

export interface UpdateBusinessBody {
  id: string;
  name: string;
}

export const tenantApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBusinesses: builder.query<BusinessApiItem[], void>({
      query: () => ({
        url: "/tenant/businesses",
      }),
      providesTags: ["Tenant", "Business"],
    }),

    createBusiness: builder.mutation<BusinessApiItem, CreateBusinessBody>({
      query: (body) => ({
        url: "/tenant/businesses",
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["Tenant", "Business"],
    }),

    updateBusiness: builder.mutation<BusinessApiItem, UpdateBusinessBody>({
      query: ({ id, ...body }) => ({
        url: `/tenant/businesses/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: ["Tenant", "Business"],
    }),

    deleteBusiness: builder.mutation<{ id: string; deletedAt: string }, string>({
      query: (id) => ({
        url: `/tenant/businesses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tenant", "Business", "Location"],
    }),

    getLocations: builder.query<LocationItem[], GetLocationsParams | void>({
      query: (params) => ({
        url: "/tenant/locations",
        params: params ? (params as Record<string, unknown>) : undefined,
      }),
      providesTags: ["Tenant", "Location"],
    }),

    createLocation: builder.mutation<LocationItem, CreateLocationBody>({
      query: (body) => ({
        url: "/tenant/locations",
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["Tenant", "Location", "Business"],
    }),

    updateLocation: builder.mutation<LocationItem, UpdateLocationBody>({
      query: ({ id, ...body }) => ({
        url: `/tenant/locations/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: ["Tenant", "Location", "Business"],
    }),

    deleteLocation: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: `/tenant/locations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tenant", "Location", "Business"],
    }),
  }),
});

type Injected = typeof tenantApi & {
  useGetBusinessesQuery: (
    arg?: void,
    options?: Omit<UseQueryOptions<BusinessApiItem[], Error>, "queryKey" | "queryFn">,
  ) => ReturnType<typeof useQuery<BusinessApiItem[], Error>>;

  useCreateBusinessMutation: (
    options?: UseMutationOptions<BusinessApiItem, Error, CreateBusinessBody>,
  ) => ReturnType<typeof useMutation<BusinessApiItem, Error, CreateBusinessBody>>;

  useUpdateBusinessMutation: (
    options?: UseMutationOptions<BusinessApiItem, Error, UpdateBusinessBody>,
  ) => ReturnType<typeof useMutation<BusinessApiItem, Error, UpdateBusinessBody>>;

  useDeleteBusinessMutation: (
    options?: UseMutationOptions<{ id: string; deletedAt: string }, Error, string>,
  ) => ReturnType<typeof useMutation<{ id: string; deletedAt: string }, Error, string>>;

  useGetLocationsQuery: (
    arg?: GetLocationsParams | void,
    options?: Omit<UseQueryOptions<LocationItem[], Error>, "queryKey" | "queryFn">,
  ) => ReturnType<typeof useQuery<LocationItem[], Error>>;

  useCreateLocationMutation: (
    options?: UseMutationOptions<LocationItem, Error, CreateLocationBody>,
  ) => ReturnType<typeof useMutation<LocationItem, Error, CreateLocationBody>>;

  useUpdateLocationMutation: (
    options?: UseMutationOptions<LocationItem, Error, UpdateLocationBody>,
  ) => ReturnType<typeof useMutation<LocationItem, Error, UpdateLocationBody>>;

  useDeleteLocationMutation: (
    options?: UseMutationOptions<{ success: boolean; id: string }, Error, string>,
  ) => ReturnType<typeof useMutation<{ success: boolean; id: string }, Error, string>>;
};

const typed = tenantApi as Injected;

export const useGetBusinessesQuery = typed.useGetBusinessesQuery;
export const useCreateBusinessMutation = typed.useCreateBusinessMutation;
export const useUpdateBusinessMutation = typed.useUpdateBusinessMutation;
export const useDeleteBusinessMutation = typed.useDeleteBusinessMutation;
export const useGetLocationsQuery = typed.useGetLocationsQuery;
export const useCreateLocationMutation = typed.useCreateLocationMutation;
export const useUpdateLocationMutation = typed.useUpdateLocationMutation;
export const useDeleteLocationMutation = typed.useDeleteLocationMutation;
