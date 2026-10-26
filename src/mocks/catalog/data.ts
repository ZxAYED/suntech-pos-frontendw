import type { Category, Product, Variant } from "@/types/domain";

export const mockCategories: Category[] = [
  { id: "cat-smartphones", name: "Smartphones", description: "Android and iOS mobile devices", isActive: true, sortOrder: 1 },
  { id: "cat-chargers", name: "Chargers", description: "Adapters, charging kits, and power banks", isActive: true, sortOrder: 2 },
  { id: "cat-earbuds", name: "Earbuds", description: "Wireless earbuds and headphones", isActive: true, sortOrder: 3 },
  { id: "cat-cables", name: "Cables", description: "Charging and data cables", isActive: true, sortOrder: 4 },
  { id: "cat-accessories", name: "Accessories", description: "Protectors, adapters, and accessories", isActive: true, sortOrder: 5 },
];

export const mockProducts: Product[] = [
  { id: "prod-charger-infinix", name: "Infinix 45W Fast Charger Kit", categoryId: "cat-chargers", brand: "Infinix", imageUrl: "/images/asset-2.jpg", isActive: true },
  { id: "prod-cable-baseus", name: "Type-C Braided Nylon Cable", categoryId: "cat-cables", brand: "Baseus", imageUrl: "/images/asset-2.jpg", isActive: true },
  { id: "prod-soundcore-r50i", name: "Anker Soundcore R50i", categoryId: "cat-earbuds", brand: "Anker", imageUrl: "/images/asset-2.jpg", isActive: true },
  { id: "prod-glass", name: "9D Privacy Tempered Glass", categoryId: "cat-accessories", brand: "Gorilla", imageUrl: "/images/asset-2.jpg", isActive: true },
  { id: "prod-galaxy-a15", name: "Samsung Galaxy A15 5G", categoryId: "cat-smartphones", brand: "Samsung", imageUrl: "/images/asset-2.jpg", isActive: true },
  { id: "prod-redmi-note-13", name: "Xiaomi Redmi Note 13", categoryId: "cat-smartphones", brand: "Xiaomi", imageUrl: "/images/asset-2.jpg", isActive: true },
  { id: "prod-baseus-adapter", name: "Baseus Super Si Fast Adapter", categoryId: "cat-chargers", brand: "Baseus", imageUrl: "/images/asset-2.jpg", isActive: true },
  { id: "prod-realme-t110", name: "Realme Buds T110 ANC", categoryId: "cat-earbuds", brand: "Realme", imageUrl: "/images/asset-2.jpg", isActive: true },
];

const productById = new Map(mockProducts.map((product) => [product.id, product]));

export const mockVariants: Variant[] = [
  ["var-inf-45w", "prod-charger-infinix", "Type-C Kit", "INF-CHG-45W", "890123456001", 1450, 28, 950, 10],
  ["var-cable-1m", "prod-cable-baseus", "1 metre", "CBL-TC-1M", "890123456002", 350, 65, 180, 20],
  ["var-r50i-black", "prod-soundcore-r50i", "Black", "ANK-R50I-BLK", "890123456003", 2150, 14, 1600, 5],
  ["var-glass-a15", "prod-glass", "Galaxy A15", "PRV-GLS-15P", "890123456004", 250, 90, 80, 25],
  ["var-a15-8-128", "prod-galaxy-a15", "8GB / 128GB", "SM-A156B-DS", "890123456005", 22999, 9, 20500, 3],
  ["var-note13-6-128", "prod-redmi-note-13", "6GB / 128GB", "RDM-NT13-6G", "890123456006", 19499, 12, 17200, 4],
  ["var-baseus-20w", "prod-baseus-adapter", "20W White", "BAS-20W-WHT", "890123456007", 950, 42, 620, 15],
  ["var-t110-white", "prod-realme-t110", "White", "RLM-T110-WHT", "890123456008", 1850, 22, 1350, 6],
].map(([id, productId, name, sku, barcode, sellingPrice, stock, costPrice, minimumStock]) => ({
  id: String(id),
  productId: String(productId),
  name: String(name),
  sku: String(sku),
  barcode: String(barcode),
  sellingPrice: Number(sellingPrice),
  stock: Number(stock),
  costPrice: Number(costPrice),
  minimumStock: Number(minimumStock),
  isActive: true,
  product: productById.get(String(productId)),
}));
