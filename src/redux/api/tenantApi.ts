"use client";

import { baseApi } from "@/redux/api/baseApi";

export interface LocationItem {
  id: string;
  businessId: string;
  name: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetLocationsParams {
  locationId?: string;
  search?: string;
}

export interface CreateLocationBody {
  name: string;
  address?: string;
}

export interface UpdateLocationBody {
  id: string;
  name?: string;
  address?: string;
}

export const tenantApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
      invalidatesTags: ["Tenant", "Location"],
    }),
    updateLocation: builder.mutation<LocationItem, UpdateLocationBody>({
      query: ({ id, ...body }) => ({
        url: `/tenant/locations/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: ["Tenant", "Location"],
    }),
    deleteLocation: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: `/tenant/locations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tenant", "Location"],
    }),
  }),
});

export const {
  useGetLocationsQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
} = tenantApi;
