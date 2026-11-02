import type { Category, Product, Variant } from "@/types/domain";

export interface CatalogRowViewModel {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  name?: string;
  variantName?: string;
  categoryId: string;
  categoryName: string;
  sku: string;
  barcode?: string;
  sellingPrice: number;
  stock: number;
  isActive: boolean;
  imageUrl?: string;
  images: string[];
  brand?: string;
  costPrice?: number;
  minimumStock?: number;
  variantCount?: number;
  rawVariant: Variant;
}

export interface RegisterCatalogItem {
  variantId: string;
  productId: string;
  name: string;
  variantName?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  categoryName: string;
  unitPrice: number;
  stock?: number;
  imageUrl?: string;
  images: string[];
  isActive: boolean;
  rawVariant?: Variant;
}

export function extractVariantImages(variant: {
  profileImageUrl?: string | null;
  images?: Array<{ url: string | null | undefined }>;
}): string[] {
  const urls: string[] = [];
  if (variant.profileImageUrl && typeof variant.profileImageUrl === "string" && variant.profileImageUrl.trim()) {
    urls.push(variant.profileImageUrl.trim());
  }
  if (Array.isArray(variant.images)) {
    for (const item of variant.images) {
      if (item?.url && typeof item.url === "string" && item.url.trim() && !urls.includes(item.url.trim())) {
        urls.push(item.url.trim());
      }
    }
  }
  return urls;
}

export function createCatalogLookupMaps(products: Product[], categories: Category[]) {
  const productMap = new Map<string, Product>();
  for (const p of products) {
    if (p.id) productMap.set(p.id, p);
  }
  const categoryMap = new Map<string, Category>();
  for (const c of categories) {
    if (c.id) categoryMap.set(c.id, c);
  }
  return { productMap, categoryMap };
}

export function mapVariantToCatalogRow(
  variant: Variant,
  products: Product[] | Map<string, Product>,
  categories: Category[] | Map<string, Category>,
  productMapOpt?: Map<string, Product>,
  categoryMapOpt?: Map<string, Category>,
): CatalogRowViewModel {
  const pMap = productMapOpt ?? (products instanceof Map ? products : null);
  const cMap = categoryMapOpt ?? (categories instanceof Map ? categories : null);

  const product =
    variant.product ??
    (pMap
      ? pMap.get(variant.productId)
      : Array.isArray(products)
      ? products.find((item) => item.id === variant.productId)
      : undefined);

  const variantCatId = variant.categoryId ?? product?.categoryId ?? (product as { category?: { id?: string } })?.category?.id;
  const category =
    (variantCatId
      ? (cMap
          ? cMap.get(variantCatId)
          : Array.isArray(categories)
          ? categories.find((item) => item.id === variantCatId)
          : undefined)
      : undefined) ??
    (product as { category?: Category })?.category ??
    (variant as { category?: Category }).category;
  const images = extractVariantImages(variant);
  const primaryImage = images[0] ?? variant.profileImageUrl ?? product?.imageUrl ?? undefined;

  // Compute total variants count for parent product
  const variantCount = product?.variants?.length ?? 1;

  const categoryId = variantCatId ?? category?.id ?? "";
  const categoryName =
    variant.categoryName ??
    category?.name ??
    (product as { category?: { name?: string } })?.category?.name ??
    "Uncategorized";
  return {
    id: variant.id,
    variantId: variant.id,
    productId: variant.productId,
    productName: variant.productName ?? product?.name ?? "Unnamed product",
    name: variant.name ?? undefined,
    variantName: variant.name ?? undefined,
    categoryId,
    categoryName,
    sku: variant.sku,
    barcode: variant.barcode ?? undefined,
    sellingPrice: variant.sellingPrice,
    stock: variant.stock ?? 0,
    isActive: variant.isActive !== false && (product?.isActive !== false),
    imageUrl: primaryImage,
    images,
    brand: product?.brand ?? undefined,
    costPrice: variant.costPrice ?? undefined,
    minimumStock: variant.minimumStock ?? undefined,
    variantCount,
    rawVariant: variant,
  };
}

export function mapVariantToRegisterItem(
  variant: Variant,
  products: Product[] | Map<string, Product>,
  categories: Category[] | Map<string, Category>,
): RegisterCatalogItem {
  const row = mapVariantToCatalogRow(variant, products, categories);
  return {
    variantId: row.variantId,
    productId: row.productId,
    name: row.productName,
    variantName: row.variantName,
    sku: row.sku,
    barcode: row.barcode,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    unitPrice: row.sellingPrice,
    stock: row.stock,
    imageUrl: row.imageUrl,
    images: row.images,
    isActive: row.isActive,
    rawVariant: variant,
  };
}
