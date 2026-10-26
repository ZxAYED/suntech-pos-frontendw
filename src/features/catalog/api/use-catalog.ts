"use client";

import { useMemo } from "react";
import { mockCategories, mockProducts, mockVariants } from "@/mocks/catalog/data";
import { useMockQuery } from "@/mocks/query";
import { mapVariantToCatalogRow } from "@/features/catalog/view-models";

export interface CatalogFilters {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  page: number;
  limit: number;
}

export function useMockCategories() {
  return useMockQuery(mockCategories);
}

export function useMockCatalog(filters: CatalogFilters) {
  const rows = useMemo(() => {
    const search = filters.search?.trim().toLowerCase() ?? "";
    return mockVariants
      .map((variant) => mapVariantToCatalogRow(variant, mockProducts, mockCategories))
      .filter((row) => !filters.categoryId || row.categoryId === filters.categoryId)
      .filter((row) => filters.isActive === undefined || row.isActive === filters.isActive)
      .filter(
        (row) =>
          !search ||
          row.productName.toLowerCase().includes(search) ||
          row.sku.toLowerCase().includes(search) ||
          row.barcode?.toLowerCase().includes(search),
      );
  }, [filters.categoryId, filters.isActive, filters.search]);
  return useMockQuery(rows);
}
