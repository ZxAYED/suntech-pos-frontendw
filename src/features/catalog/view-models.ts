import type { Category, Product, Variant } from "@/types/domain";

export interface CatalogRowViewModel {
  variantId: string;
  productId: string;
  productName: string;
  variantName?: string;
  categoryId: string;
  categoryName: string;
  sku: string;
  barcode?: string;
  sellingPrice: number;
  stock: number;
  isActive: boolean;
  imageUrl?: string;
  brand?: string;
  costPrice?: number;
  minimumStock?: number;
}

export interface RegisterCatalogItem {
  variantId: string;
  productId: string;
  name: string;
  variantName?: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  unitPrice: number;
  stock?: number;
  imageUrl?: string;
  isActive: boolean;
}

export function mapVariantToCatalogRow(
  variant: Variant,
  products: Product[],
  categories: Category[],
): CatalogRowViewModel {
  const product = variant.product ?? products.find((item) => item.id === variant.productId);
  const category = categories.find((item) => item.id === product?.categoryId);
  return {
    variantId: variant.id,
    productId: variant.productId,
    productName: product?.name ?? "Unnamed product",
    variantName: variant.name ?? undefined,
    categoryId: product?.categoryId ?? "",
    categoryName: category?.name ?? "Uncategorized",
    sku: variant.sku,
    barcode: variant.barcode ?? undefined,
    sellingPrice: variant.sellingPrice,
    stock: variant.stock,
    isActive: variant.isActive && (product?.isActive ?? true),
    imageUrl: product?.imageUrl ?? undefined,
    brand: product?.brand ?? undefined,
    costPrice: variant.costPrice ?? undefined,
    minimumStock: variant.minimumStock ?? undefined,
  };
}

export function mapVariantToRegisterItem(
  variant: Variant,
  products: Product[],
  categories: Category[],
): RegisterCatalogItem {
  const row = mapVariantToCatalogRow(variant, products, categories);
  return {
    variantId: row.variantId,
    productId: row.productId,
    name: row.productName,
    variantName: row.variantName,
    sku: row.sku,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    unitPrice: row.sellingPrice,
    stock: row.stock,
    imageUrl: row.imageUrl,
    isActive: row.isActive,
  };
}
