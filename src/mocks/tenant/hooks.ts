"use client";

import { mockBusinesses } from "@/mocks/tenant/data";
import { useMockMutation, useMockQuery } from "@/mocks/query";

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
  createdAt: string;
  updatedAt: string;
  locations: LocationItem[];
}

const apiBusinesses: BusinessApiItem[] = mockBusinesses.map((business) => ({
  id: business.id,
  name: business.name,
  ownerId: "mock-owner",
  profileImageUrl: business.profileImageUrl ?? null,
  createdAt: business.createdAt ?? "2026-01-01T00:00:00Z",
  updatedAt: business.updatedAt ?? "2026-01-01T00:00:00Z",
  locations: (business.locations ?? []).map((location) => ({
    id: location.id,
    businessId: location.businessId,
    name: location.name,
    address: location.address ?? null,
    createdAt: location.createdAt ?? "2026-01-01T00:00:00Z",
    updatedAt: location.updatedAt ?? "2026-01-01T00:00:00Z",
  })),
}));

export function useGetBusinessesQuery() {
  return useMockQuery(apiBusinesses);
}

export function useCreateBusinessMutation() {
  return useMockMutation(async ({ name }: { name: string }) => ({
    business: { ...apiBusinesses[0], id: `mock-business-${Date.now()}`, name, locations: [] },
  }));
}

export function useUpdateBusinessMutation() {
  return useMockMutation(async ({ id, name }: { id: string; name: string }) => ({
    ...(apiBusinesses.find((business) => business.id === id) ?? apiBusinesses[0]),
    id,
    name,
  }));
}

export function useDeleteBusinessMutation() {
  return useMockMutation(async (id: string) => ({ id, deletedAt: new Date().toISOString() }));
}

export function useCreateLocationMutation() {
  return useMockMutation(async ({ businessId = "", name, address }: { businessId?: string; name: string; address?: string }) => ({
    id: `mock-location-${Date.now()}`,
    businessId,
    name,
    address: address ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export function useUpdateLocationMutation() {
  return useMockMutation(async ({ id, name = "Branch", address }: { id: string; name?: string; address?: string }) => ({
    id,
    businessId: "",
    name,
    address: address ?? null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: new Date().toISOString(),
  }));
}

export function useDeleteLocationMutation() {
  return useMockMutation(async (id: string) => ({ success: true, id }));
}
