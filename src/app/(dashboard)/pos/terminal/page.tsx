"use client";

import { useState } from "react";
import {
  Barcode,
  CreditCard,
  Headphones,
  Minus,
  Percent,
  Plus,
  Receipt,
  Search,
  Shield,
  Smartphone,
  Trash2,
  Tv,
  User,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  category: "Smartphones" | "Chargers" | "Earbuds" | "Cables" | "Accessories";
  price: number;
  stock: number;
  icon: React.ComponentType<{ className?: string }>;
  accentBg: string;
  accentText: string;
}

const catalogProducts: ProductItem[] = [
  {
    id: "prod-1",
    name: "Infinix 45W Fast Charger",
    sku: "INF-CHG-45W",
    category: "Chargers",
    price: 1450,
    stock: 28,
    icon: Zap,
    accentBg: "bg-blue-50",
    accentText: "text-[#0052FF]",
  },
  {
    id: "prod-2",
    name: "Type-C Braided Cable 1m",
    sku: "CBL-TC-1M",
    category: "Cables",
    price: 350,
    stock: 65,
    icon: Zap,
    accentBg: "bg-emerald-50",
    accentText: "text-emerald-600",
  },
  {
    id: "prod-3",
    name: "Anker Soundcore R50i",
    sku: "ANK-R50I-BLK",
    category: "Earbuds",
    price: 2150,
    stock: 14,
    icon: Headphones,
    accentBg: "bg-purple-50",
    accentText: "text-purple-600",
  },
  {
    id: "prod-4",
    name: "Privacy Glass Protector",
    sku: "PRV-GLS-15P",
    category: "Accessories",
    price: 250,
    stock: 90,
    icon: Shield,
    accentBg: "bg-slate-100",
    accentText: "text-slate-700",
  },
  {
    id: "prod-5",
    name: "Samsung Galaxy A15 5G (8GB/128GB)",
    sku: "SM-A156B-DS",
    category: "Smartphones",
    price: 22999,
    stock: 9,
    icon: Smartphone,
    accentBg: "bg-indigo-50",
    accentText: "text-indigo-600",
  },
  {
    id: "prod-6",
    name: "Xiaomi Redmi Note 13 (6GB/128GB)",
    sku: "RDM-NT13-6G",
    category: "Smartphones",
    price: 19499,
    stock: 12,
    icon: Smartphone,
    accentBg: "bg-amber-50",
    accentText: "text-amber-600",
  },
  {
    id: "prod-7",
    name: "Baseus 20W Super Si Charger",
    sku: "BAS-20W-WHT",
    category: "Chargers",
    price: 950,
    stock: 42,
    icon: Zap,
    accentBg: "bg-blue-50",
    accentText: "text-[#0052FF]",
  },
  {
    id: "prod-8",
    name: "Realme Buds T110 TWS",
    sku: "RLM-T110-WHT",
    category: "Earbuds",
    price: 1850,
    stock: 22,
    icon: Headphones,
    accentBg: "bg-purple-50",
    accentText: "text-purple-600",
  },
  {
    id: "prod-9",
    name: "Baseus Cafule Type-C to Lightning 2m",
    sku: "BAS-CL-2M-RED",
    category: "Cables",
    price: 650,
    stock: 35,
    icon: Zap,
    accentBg: "bg-emerald-50",
    accentText: "text-emerald-600",
  },
  {
    id: "prod-10",
    name: "Apple 20W USB-C Power Adapter",
    sku: "APL-20W-ORIG",
    category: "Chargers",
    price: 2800,
    stock: 18,
    icon: Zap,
    accentBg: "bg-blue-50",
    accentText: "text-[#0052FF]",
  },
  {
    id: "prod-11",
    name: "Joyroom 10000mAh Power Bank",
    sku: "JYR-10K-PB",
    category: "Chargers",
    price: 1650,
    stock: 31,
    icon: Zap,
    accentBg: "bg-amber-50",
    accentText: "text-amber-600",
  },
  {
    id: "prod-12",
    name: "Remax OTG Adapter Type-C to USB",
    sku: "RMX-OTG-U3",
    category: "Cables",
    price: 180,
    stock: 80,
    icon: Tv,
    accentBg: "bg-slate-100",
    accentText: "text-slate-700",
  },
];

interface CartLineItem {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
}

const initialCartItems: CartLineItem[] = [
  {
    id: "cart-1",
    name: "Infinix 45W Fast Charger",
    sku: "INF-CHG-45W",
    unitPrice: 1450,
    quantity: 1,
  },
  {
    id: "cart-2",
    name: "Type-C Braided Cable 1m",
    sku: "CBL-TC-1M",
    unitPrice: 350,
    quantity: 2,
  },
];

const categoryList = ["All", "Smartphones", "Chargers", "Earbuds", "Cables"] as const;

export default function TerminalPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartLineItem[]>(initialCartItems);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  const filteredProducts = catalogProducts.filter((product) => {
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Strict integer financial math in BDT
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0,
  );
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  // 5% standard retail VAT
  const vat = Math.round(taxableSubtotal * 0.05);
  const grandTotal = taxableSubtotal + vat;

  const handleAddToCart = (product: ProductItem) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.sku === product.sku);
      if (existing) {
        return prev.map((item) =>
          item.sku === product.sku
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: `cart-${Date.now()}-${product.sku}`,
          name: product.name,
          sku: product.sku,
          unitPrice: product.price,
          quantity: 1,
        },
      ];
    });
    toast.success(`Added ${product.name} to active ticket`);
  };

  const handleUpdateQty = (sku: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.sku === sku) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartLineItem => item !== null),
    );
  };

  const handleRemove = (sku: string) => {
    setCartItems((prev) => prev.filter((item) => item.sku !== sku));
    toast.info("Line item removed from ticket");
  };

  const handleClearTicket = () => {
    setCartItems([]);
    setDiscountPercent(0);
    toast.info("Active ticket cleared");
  };

  const handleChargeCOD = () => {
    if (cartItems.length === 0) return;
    toast.success(
      `Successfully processed ${grandTotal.toLocaleString("en-BD")} BDT via Cash on Delivery (COD)`,
    );
    setCartItems([]);
    setDiscountPercent(0);
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-5.5rem)] gap-4 select-none font-sans">
      {/* Task 3 Left Side (60% Width): Catalog Workspace */}
      <section className="flex w-[60%] flex-col space-y-3">
        {/* Top: High-density search bar with barcode icon & scan trigger */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product name, SKU, or scan barcode (F2)..."
              className="h-9 pl-9 pr-4 text-xs border-slate-200 bg-white text-slate-700 shadow-none placeholder:text-slate-500 focus-visible:border-[#0052FF]"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toast.info("Barcode scanner ready. Awaiting hardware input...")}
            className="h-9 gap-1.5 border-slate-200 text-xs px-3 font-semibold text-[#070B28] bg-white hover:bg-slate-50 shadow-xs"
          >
            <Barcode className="h-4 w-4 text-[#0052FF]" />
            <span>Scan (F4)</span>
          </Button>
        </div>

        {/* Quick category filters: "All", "Smartphones", "Chargers", "Earbuds", "Cables" */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categoryList.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                  isSelected
                    ? "bg-[#0052FF] text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-700 hover:text-[#070B28] hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Catalog Grid: Compact cards with 1px border, Poppins font, and strict typographic hierarchy */}
        <div className="grid flex-1 grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-fr overflow-y-auto pr-1">
          {filteredProducts.map((product) => {
            const Icon = product.icon;
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => handleAddToCart(product)}
                className="group relative flex flex-col justify-between rounded-md border border-slate-200 bg-white p-3 text-left shadow-xs transition-all duration-150 hover:border-[#0052FF]/60 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.98]"
              >
                {/* Card Top: Icon + SKU + Stock */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded ${product.accentBg} ${product.accentText}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      {/* SKU in text-slate-500 text-xs font-mono */}
                      <span className="font-mono text-xs text-slate-500 tabular-nums">
                        {product.sku}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        product.stock <= 10
                          ? "bg-amber-50 text-amber-700 border border-amber-200/50"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                      }`}
                    >
                      {product.stock} in stock
                    </span>
                  </div>

                  {/* Variant name in text-[#070B28] font-semibold */}
                  <h4 className="mt-2 text-xs font-semibold leading-tight text-[#070B28] group-hover:text-[#0052FF] transition-colors line-clamp-2">
                    {product.name}
                  </h4>
                </div>

                {/* Card Bottom: Category & Price in font-mono tabular-nums text-[#0052FF] font-bold */}
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                  <span className="text-[11px] font-medium text-slate-500">
                    {product.category}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-sm sm:text-base font-bold text-[#0052FF] tabular-nums">
                      {product.price.toLocaleString("en-BD")}
                    </span>
                    <span className="text-[10px] font-bold text-[#0052FF]">BDT</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Task 3 Right Side (40% Width): Active Cart Sidebar */}
      <aside className="sticky top-0 flex w-[40%] flex-col">
        <Card className="flex h-full flex-col border border-slate-200 bg-white rounded-lg shadow-sm">
          <CardContent className="flex h-full flex-col p-3.5 sm:p-4">
            {/* Header: "Active Ticket" in text-[#070B28] font-bold */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-[#0052FF]">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#070B28]">
                    Active Ticket
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500">
                    Terminal Register 01
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="border-slate-200 font-mono text-[11px] tabular-nums font-semibold text-[#070B28]"
                >
                  #TCK-9904
                </Badge>
                <Badge
                  variant="outline"
                  className="border-slate-200 text-[11px] font-medium text-slate-700 gap-1"
                >
                  <User className="h-3 w-3 text-slate-500" />
                  <span>Walk-in</span>
                </Badge>
              </div>
            </div>

            {/* Cart Item Rows: Compact list showing quantity adjusters (- / +), item title, subtotal */}
            <div className="flex-1 space-y-2 overflow-y-auto py-3 pr-0.5">
              {cartItems.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center rounded-md border border-dashed border-slate-200 p-4 text-center">
                  <Receipt className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-[#070B28]">
                    Ticket is Empty
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Click items in the catalog or scan barcodes to begin order.
                  </p>
                </div>
              ) : (
                cartItems.map((item) => {
                  const lineTotal = item.unitPrice * item.quantity;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between rounded-md border border-slate-200 bg-slate-50/60 p-2.5 transition-all duration-150 hover:bg-slate-50 hover:border-slate-300"
                    >
                      {/* Item Title in text-[#070B28] font-medium */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-[#070B28] leading-tight truncate">
                            {item.name}
                          </p>
                          <p className="mt-0.5 font-mono text-xs text-slate-500 tabular-nums">
                            {item.sku} : {item.unitPrice.toLocaleString("en-BD")} BDT
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.sku)}
                          className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Quantity adjusters (- / +) and subtotal in font-mono text-slate-700 */}
                      <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/70 pt-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.sku, -1)}
                            className="flex h-6 w-6 items-center justify-center rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-[#070B28] active:scale-[0.95] transition-colors"
                            title="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center font-mono text-xs font-bold tabular-nums text-[#070B28]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.sku, 1)}
                            className="flex h-6 w-6 items-center justify-center rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-[#070B28] active:scale-[0.95] transition-colors"
                            title="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
                            {lineTotal.toLocaleString("en-BD")} BDT
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Tactical Ticket Toolbar */}
            <div className="grid grid-cols-3 gap-1.5 border-t border-slate-200 pt-2.5 pb-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setDiscountPercent((prev) => (prev === 0 ? 5 : 0));
                  toast.info(discountPercent === 0 ? "Applied 5% retail discount" : "Discount removed");
                }}
                className={`h-7 text-[11px] gap-1 font-semibold border-slate-200 ${
                  discountPercent > 0
                    ? "bg-blue-50 text-[#0052FF] border-blue-200"
                    : "text-slate-700 bg-white hover:bg-slate-50"
                }`}
              >
                <Percent className="h-3 w-3 text-slate-500" />
                <span>{discountPercent > 0 ? "5% Off" : "Discount"}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => toast.info("Split payment modal configured for bKash + Cash")}
                className="h-7 text-[11px] gap-1 font-semibold text-slate-700 border-slate-200 bg-white hover:bg-slate-50"
              >
                <CreditCard className="h-3 w-3 text-slate-500" />
                <span>Split Tender</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearTicket}
                disabled={cartItems.length === 0}
                className="h-7 text-[11px] gap-1 font-semibold text-slate-700 border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3 text-slate-500" />
                <span>Clear</span>
              </Button>
            </div>

            {/* Bottom Section: Subtotal, VAT (text-slate-500), Final Total (text-2xl font-mono font-bold text-[#070B28]) */}
            <div className="space-y-1.5 border-t border-slate-200 pt-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">
                  Subtotal ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} items)
                </span>
                <span className="font-mono tabular-nums font-semibold text-[#070B28]">
                  {subtotal.toLocaleString("en-BD")} BDT
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 font-medium">
                  <span>Discount ({discountPercent}%)</span>
                  <span className="font-mono tabular-nums font-semibold">
                    -{discountAmount.toLocaleString("en-BD")} BDT
                  </span>
                </div>
              )}

              <div className="flex justify-between text-xs">
                <span className="text-slate-500">VAT (5%)</span>
                <span className="font-mono tabular-nums font-semibold text-[#070B28]">
                  {vat.toLocaleString("en-BD")} BDT
                </span>
              </div>

              {/* Grand Total */}
              <div className="flex items-baseline justify-between border-t border-slate-200 pt-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Final Total
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-mono font-bold text-[#070B28] tabular-nums">
                    {grandTotal.toLocaleString("en-BD")}
                  </span>
                  <span className="text-xs font-bold font-mono text-[#070B28]">BDT</span>
                </div>
              </div>

              {/* Primary Action Button: Large Electric Blue #0052FF button labeled "Charge Cash (COD)" */}
              <Button
                type="button"
                disabled={cartItems.length === 0}
                onClick={handleChargeCOD}
                className="mt-3 w-full h-11 rounded-md bg-[#0052FF] hover:bg-[#0047E0] text-white font-semibold text-xs tracking-wide shadow-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
              >
                Charge Cash (COD) : {grandTotal.toLocaleString("en-BD")} BDT
              </Button>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
