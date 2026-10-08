"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FolderTree,
  MoreHorizontal,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { DataPagination } from "@/components/common/data-pagination";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { demoProducts, type DemoProduct } from "@/demo/products";

export interface DemoCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
}

const initialCategories: DemoCategory[] = [
  {
    id: "cat-1",
    name: "Smartphones",
    slug: "smartphones",
    description: "Flagship and budget Android & iOS mobile devices",
    status: "ACTIVE",
  },
  {
    id: "cat-2",
    name: "Chargers",
    slug: "chargers",
    description: "Fast charging wall adapters, GaN bricks, and power banks",
    status: "ACTIVE",
  },
  {
    id: "cat-3",
    name: "Earbuds",
    slug: "earbuds",
    description: "TWS earphones, ANC headphones, and wireless neckbands",
    status: "ACTIVE",
  },
  {
    id: "cat-4",
    name: "Cables",
    slug: "cables",
    description: "Braided USB-C to C, Lightning, and high-speed data cables",
    status: "ACTIVE",
  },
  {
    id: "cat-5",
    name: "Accessories",
    slug: "accessories",
    description: "Cases, phone stands, lanyard straps, and cleaning kits",
    status: "ACTIVE",
  },
];

export function CatalogManager() {
  const [activeTab, setActiveTab] = useState<"products" | "categories">("products");
  const [products, setProducts] = useState<DemoProduct[]>(demoProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Products Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Category Management State
  const [categoryList, setCategoryList] = useState<DemoCategory[]>(initialCategories);
  const [catSearchQuery, setCatSearchQuery] = useState("");
  const [catCurrentPage, setCatCurrentPage] = useState(1);
  const [catPageSize, setCatPageSize] = useState(5);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState({
    name: "",
    slug: "",
    description: "",
  });

  // Delete Confirmation Modal States
  const [isDeleteProdModalOpen, setIsDeleteProdModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<DemoProduct | null>(null);
  const [isDeleteCatModalOpen, setIsDeleteCatModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<DemoCategory | null>(null);

  // New item form state
  const [itemForm, setItemForm] = useState({
    name: "",
    brand: "",
    category: "Chargers" as DemoProduct["category"],
    sku: "",
    barcode: "",
    costPrice: 500,
    price: 850,
    stock: 25,
    minStock: 5,
    warranty: "6 Months Official",
  });

  const categories = ["All", ...categoryList.map((c) => c.name)];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleOpenAddModal = () => {
    setEditingId(null);
    setItemForm({
      name: "",
      brand: "",
      category: "Chargers",
      sku: "",
      barcode: "",
      costPrice: 500,
      price: 850,
      stock: 25,
      minStock: 5,
      warranty: "6 Months Official",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: DemoProduct) => {
    setEditingId(p.id);
    setItemForm({
      name: p.name,
      brand: p.brand,
      category: p.category,
      sku: p.sku,
      barcode: p.barcode,
      costPrice: p.costPrice,
      price: p.price,
      stock: p.stock,
      minStock: p.minStock,
      warranty: p.warranty,
    });
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success(`Removed "${name}" from catalog.`);
    if (paginatedProducts.length === 1 && currentPage > 1) {
      setCurrentPage((c) => c - 1);
    }
  };

  const handlePromptDeleteProduct = (p: DemoProduct) => {
    setProductToDelete(p);
    setIsDeleteProdModalOpen(true);
  };

  const handleConfirmDeleteProduct = () => {
    if (!productToDelete) return;
    handleDeleteProduct(productToDelete.id, productToDelete.name);
    setIsDeleteProdModalOpen(false);
    setProductToDelete(null);
  };

  const handleAdjustStock = (p: DemoProduct, delta: number) => {
    setProducts((prev) =>
      prev.map((item) =>
        item.id === p.id ? { ...item, stock: Math.max(0, item.stock + delta) } : item,
      ),
    );
    toast.success(`Adjusted stock for ${p.sku} (${delta > 0 ? "+" : ""}${delta} units)`);
  };

  const handleDuplicateProduct = (p: DemoProduct) => {
    const cloned: DemoProduct = {
      ...p,
      id: `prod-${Date.now()}`,
      name: `${p.name} (Copy)`,
      sku: `${p.sku}-CPY`,
      barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
    };
    setProducts([cloned, ...products]);
    toast.success(`Cloned product into new SKU: ${cloned.sku}`);
  };

  const handleFormSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!itemForm.name.trim() || !itemForm.sku.trim()) {
      toast.error("Please provide product name and SKU code.");
      return;
    }

    if (editingId) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? {
                ...p,
                name: itemForm.name.trim(),
                brand: itemForm.brand.trim() || "SunTech",
                category: itemForm.category,
                sku: itemForm.sku.trim().toUpperCase(),
                barcode: itemForm.barcode.trim(),
                costPrice: Number(itemForm.costPrice),
                price: Number(itemForm.price),
                stock: Number(itemForm.stock),
                minStock: Number(itemForm.minStock),
                warranty: itemForm.warranty.trim() || "1 Year Official",
              }
            : p,
        ),
      );
      toast.success(`Updated SKU "${itemForm.sku.toUpperCase()}"!`);
    } else {
      const created: DemoProduct = {
        id: `prod-${Date.now()}`,
        name: itemForm.name.trim(),
        brand: itemForm.brand.trim() || "SunTech",
        category: itemForm.category,
        sku: itemForm.sku.trim().toUpperCase(),
        barcode: itemForm.barcode.trim() || `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        costPrice: Number(itemForm.costPrice),
        price: Number(itemForm.price),
        stock: Number(itemForm.stock),
        minStock: Number(itemForm.minStock),
        warranty: itemForm.warranty.trim() || "1 Year Official",
        image: "/images/asset-2.jpg",
      };
      setProducts([created, ...products]);
      toast.success(`Registered SKU "${created.sku}" to product catalog!`);
    }

    setIsModalOpen(false);
  };

  const filteredCategories = categoryList.filter(
    (c) =>
      c.name.toLowerCase().includes(catSearchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(catSearchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(catSearchQuery.toLowerCase()),
  );

  const catTotalPages = Math.ceil(filteredCategories.length / catPageSize) || 1;
  const paginatedCategories = filteredCategories.slice(
    (catCurrentPage - 1) * catPageSize,
    catCurrentPage * catPageSize,
  );

  const handleOpenAddCatModal = () => {
    setEditingCatId(null);
    setCatForm({ name: "", slug: "", description: "" });
    setIsCatModalOpen(true);
  };

  const handleOpenEditCatModal = (c: DemoCategory) => {
    setEditingCatId(c.id);
    setCatForm({ name: c.name, slug: c.slug, description: c.description });
    setIsCatModalOpen(true);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    setCategoryList((prev) => prev.filter((c) => c.id !== id));
    toast.success(`Removed category "${name}".`);
  };

  const handlePromptDeleteCategory = (c: DemoCategory) => {
    setCategoryToDelete(c);
    setIsDeleteCatModalOpen(true);
  };

  const handleConfirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    handleDeleteCategory(categoryToDelete.id, categoryToDelete.name);
    setIsDeleteCatModalOpen(false);
    setCategoryToDelete(null);
  };

  const handleSaveCategory = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!catForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    const slug = catForm.slug.trim() || catForm.name.toLowerCase().replace(/\s+/g, "-");

    if (editingCatId) {
      setCategoryList((prev) =>
        prev.map((c) =>
          c.id === editingCatId
            ? { ...c, name: catForm.name, slug, description: catForm.description }
            : c,
        ),
      );
      toast.success(`Updated category "${catForm.name}".`);
    } else {
      const newCat: DemoCategory = {
        id: `cat-${Date.now()}`,
        name: catForm.name,
        slug,
        description: catForm.description,
        status: "ACTIVE",
      };
      setCategoryList((prev) => [...prev, newCat]);
      toast.success(`Created new category "${catForm.name}".`);
    }
    setIsCatModalOpen(false);
  };

  return (
    <div className="space-y-6 font-sans select-none">
      {/* ═══ Row 1: The Main Header (Title + Actions ONLY) ═══ */}
      <PageHeader
        title={activeTab === "products" ? "Product Catalog" : "Product Categories"}
        actions={
          activeTab === "products" ? (
            <>
              <Button
                variant="outline"
                onClick={() => toast.info("Exporting SKU ledger to CSV/Excel...")}
                className="min-h-11 h-11 px-5 border-slate-200 text-sm font-medium text-[#070B28] bg-white hover:bg-slate-50 cursor-pointer shadow-xs gap-2"
              >
                <Download className="h-4 w-4 text-slate-500" />
                <span>Export CSV</span>
              </Button>
              <Button
                size="lg"
                onClick={handleOpenAddModal}
                className="min-h-12 h-12 px-8 bg-[#0052FF] hover:bg-[#0047E0] text-white text-base font-medium cursor-pointer shadow-xs gap-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add New Product</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => toast.info("Exporting categories list to CSV...")}
                className="min-h-11 h-11 px-5 border-slate-200 text-sm font-medium text-[#070B28] bg-white hover:bg-slate-50 cursor-pointer shadow-xs gap-2"
              >
                <Download className="h-4 w-4 text-slate-500" />
                <span>Export CSV</span>
              </Button>
              <Button
                size="lg"
                onClick={handleOpenAddCatModal}
                className="min-h-12 h-12 px-8 bg-[#0052FF] hover:bg-[#0047E0] text-white text-base font-medium cursor-pointer shadow-xs gap-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Category</span>
              </Button>
            </>
          )
        }
      />

      {/* ═══ Row 2: The Toolbar / Sub-navigation ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {/* Left: View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
              activeTab === "products"
                ? "bg-white text-[#070B28] shadow-xs"
                : "text-slate-600 hover:text-[#070B28]"
            }`}
          >
            Products ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
              activeTab === "categories"
                ? "bg-white text-[#070B28] shadow-xs"
                : "text-slate-600 hover:text-[#070B28]"
            }`}
          >
            Categories ({categoryList.length})
          </button>
        </div>

        {/* Right: Search + Filters */}
        {activeTab === "products" ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name, SKU, or barcode..."
                className="min-h-11 h-11 pl-10 pr-4 text-sm font-medium border-slate-200 bg-white text-[#070B28] placeholder:text-slate-400 shadow-xs focus-visible:border-[#0052FF] focus-visible:ring-2 focus-visible:ring-[#0052FF]/20"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setCurrentPage(1);
                  }}
                  className={`rounded-md px-3.5 py-1.5 text-xs font-semibold cursor-pointer transition-colors shadow-xs ${
                    selectedCategory === cat
                      ? "bg-[#0052FF] text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:text-[#070B28] hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={catSearchQuery}
              onChange={(e) => {
                setCatSearchQuery(e.target.value);
                setCatCurrentPage(1);
              }}
              placeholder="Search categories..."
              className="min-h-11 h-11 pl-10 pr-4 text-sm font-medium border-slate-200 bg-white text-[#070B28] placeholder:text-slate-400 shadow-xs focus-visible:border-[#0052FF] focus-visible:ring-2 focus-visible:ring-[#0052FF]/20"
            />
          </div>
        )}
      </div>

      {/* ═══ Main Table: Products or Categories ═══ */}
      {activeTab === "products" ? (
        <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full text-sm">
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Product / Item
                </TableHead>
                <TableHead className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Category
                </TableHead>
                <TableHead className="py-3.5 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Cost (BDT)
                </TableHead>
                <TableHead className="py-3.5 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Retail (BDT)
                </TableHead>
                <TableHead className="py-3.5 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Margin
                </TableHead>
                <TableHead className="py-3.5 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Stock
                </TableHead>
                <TableHead className="py-3.5 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 w-28">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {paginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-slate-400 text-sm">
                    No products found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((p) => {
                  const marginPercent = Math.round(((p.price - p.costPrice) / p.price) * 100);
                  const isLow = p.stock <= p.minStock;

                  return (
                    <TableRow key={p.id} className="h-16 hover:bg-slate-50/70 transition-colors">
                      {/* Item with Thumbnail and SKU directly beneath Product Name */}
                      <TableCell className="py-3.5 px-4 text-left">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            <Image
                              src={p.image}
                              alt={p.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm sm:text-[15px] text-[#070B28] leading-tight line-clamp-1">
                              {p.name}
                            </p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                              {p.sku} · {p.brand}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell className="py-3.5 px-4 text-left text-slate-600">
                        <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          {p.category}
                        </span>
                      </TableCell>

                      {/* Cost BDT */}
                      <TableCell className="py-3.5 px-4 text-right font-mono text-sm text-slate-600 tabular-nums">
                        <span className="font-mono tabular-nums text-[#070B28]">
                          {p.costPrice.toLocaleString("en-BD")}
                        </span>
                      </TableCell>

                      {/* Retail BDT */}
                      <TableCell className="py-3.5 px-4 text-right font-mono text-sm sm:text-base font-bold tabular-nums">
                        <span className="font-mono tabular-nums text-[#070B28]">
                          {p.price.toLocaleString("en-BD")}
                        </span>
                      </TableCell>

                      {/* Margin */}
                      <TableCell className="py-3.5 px-4 text-right font-mono text-sm font-semibold tabular-nums">
                        <span className="font-mono tabular-nums text-emerald-600">
                          +{marginPercent}%
                        </span>
                      </TableCell>

                      {/* Stock Status */}
                      <TableCell className="py-3.5 px-4 text-right font-mono text-sm font-semibold tabular-nums">
                        <span
                          className={`font-mono tabular-nums font-bold ${
                            isLow ? "text-amber-600" : "text-[#070B28]"
                          }`}
                        >
                          {p.stock} pcs
                        </span>
                      </TableCell>

                      {/* Row Action Column: Direct Edit/Delete Buttons + Dropdown */}
                      <TableCell className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Direct Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p)}
                            className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg text-slate-500 hover:text-[#0052FF] hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-colors cursor-pointer"
                            title="Edit Product Details"
                            aria-label={`Edit ${p.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          {/* Direct Delete Button */}
                          <button
                            type="button"
                            onClick={() => handlePromptDeleteProduct(p)}
                            className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                            title="Delete Product"
                            aria-label={`Delete ${p.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          {/* Dropdown for Secondary Options */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg text-slate-400 hover:text-[#070B28] hover:bg-slate-100 cursor-pointer transition-colors"
                                title="More actions"
                                aria-label="Product actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-white border-slate-200 shadow-xl rounded-lg p-1.5 z-50">
                              <DropdownMenuItem
                                onClick={() => handleOpenEditModal(p)}
                                className="flex items-center gap-2.5 py-2 px-3 text-xs font-semibold text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                              >
                                <Pencil className="h-4 w-4 text-slate-500" />
                                <span>Edit Details</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleAdjustStock(p, 10)}
                                className="flex items-center gap-2.5 py-2 px-3 text-xs font-semibold text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                              >
                                <Boxes className="h-4 w-4 text-slate-500" />
                                <span>Add +10 Stock</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDuplicateProduct(p)}
                                className="flex items-center gap-2.5 py-2 px-3 text-xs font-semibold text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                              >
                                <Copy className="h-4 w-4 text-slate-500" />
                                <span>Duplicate SKU</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1 bg-slate-100" />
                              <DropdownMenuItem
                                onClick={() => handlePromptDeleteProduct(p)}
                                className="flex items-center gap-2.5 py-2 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer rounded-md transition-colors"
                              >
                                <Trash2 className="h-4 w-4 text-rose-500" />
                                <span>Delete SKU</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* ═══ Reusable DataPagination ═══ */}
        <div className="border-t border-slate-200 bg-white px-4 py-1">
          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredProducts.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[5, 8, 15, 30]}
            itemLabel="products"
          />
        </div>
      </div>
      ) : (
        /* High-Density Categories Table */
        <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="w-full text-sm">
              <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Category Name & Description
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Slug / Code
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Active SKUs
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Total Units
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Inventory Value (BDT)
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </TableHead>
                  <TableHead className="py-3.5 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 w-28">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {paginatedCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center text-slate-400 text-sm">
                      No categories found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCategories.map((cat) => {
                    const catProducts = products.filter(
                      (p) => p.category.toLowerCase() === cat.name.toLowerCase(),
                    );
                    const totalUnits = catProducts.reduce((sum, p) => sum + p.stock, 0);
                    const totalValue = catProducts.reduce((sum, p) => sum + p.stock * p.price, 0);

                    return (
                      <TableRow key={cat.id} className="h-16 hover:bg-slate-50/70 transition-colors">
                        <TableCell className="py-3.5 px-4">
                          <div className="font-semibold text-sm sm:text-[15px] text-[#070B28]">
                            {cat.name}
                          </div>
                          <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {cat.description}
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-left">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {cat.slug}
                          </span>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-center font-mono font-bold text-[#070B28] tabular-nums">
                          {catProducts.length}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700 tabular-nums">
                          {totalUnits} pcs
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-right font-mono font-bold text-[#070B28] tabular-nums">
                          {totalValue.toLocaleString("en-BD")}{" "}
                          <span className="text-xs font-normal text-slate-400 font-sans">BDT</span>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded border text-emerald-700 bg-emerald-50 border-emerald-200/60">
                            {cat.status}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Direct Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditCatModal(cat)}
                              className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg text-slate-500 hover:text-[#0052FF] hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-colors cursor-pointer"
                              title="Edit Category Details"
                              aria-label={`Edit ${cat.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            {/* Direct Delete Button */}
                            <button
                              type="button"
                              onClick={() => handlePromptDeleteCategory(cat)}
                              className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                              title="Delete Category"
                              aria-label={`Delete ${cat.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>

                            {/* Dropdown Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg text-slate-400 hover:text-[#070B28] hover:bg-slate-100 cursor-pointer transition-colors"
                                  title="Category actions"
                                  aria-label="Category actions"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 bg-white border-slate-200 shadow-xl rounded-lg p-1.5 z-50">
                                <DropdownMenuItem
                                  onClick={() => handleOpenEditCatModal(cat)}
                                  className="flex items-center gap-2 py-2 px-3 text-xs font-semibold text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                                >
                                  <Pencil className="h-4 w-4 text-slate-500" />
                                  <span>Edit Details</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCategory(cat.name);
                                    setActiveTab("products");
                                    setCurrentPage(1);
                                    toast.info(`Filtering catalog by "${cat.name}".`);
                                  }}
                                  className="flex items-center gap-2 py-2 px-3 text-xs font-semibold text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                                >
                                  <Eye className="h-4 w-4 text-slate-500" />
                                  <span>View Products</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => toast.success(`Exporting ${cat.name} product report...`)}
                                  className="flex items-center gap-2 py-2 px-3 text-xs font-semibold text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                                >
                                  <Download className="h-4 w-4 text-slate-500" />
                                  <span>Export CSV</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1 bg-slate-100" />
                                <DropdownMenuItem
                                  onClick={() => handlePromptDeleteCategory(cat)}
                                  className="flex items-center gap-2 py-2 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer rounded-md transition-colors"
                                >
                                  <Trash2 className="h-4 w-4 text-rose-500" />
                                  <span>Delete Category</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Category Pagination */}
          <div className="border-t border-slate-200 bg-white px-4 py-1">
            <DataPagination
              currentPage={catCurrentPage}
              totalPages={catTotalPages}
              totalItems={filteredCategories.length}
              pageSize={catPageSize}
              onPageChange={setCatCurrentPage}
              onPageSizeChange={(newSize) => {
                setCatPageSize(newSize);
                setCatCurrentPage(1);
              }}
              pageSizeOptions={[5, 10, 20]}
              itemLabel="categories"
            />
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Item in Catalog */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-[#070B28]/60 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative z-10 w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-[#0052FF]">
                    <PackagePlus className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-[#070B28]">
                      {editingId ? "Edit Catalog Product" : "Add New Catalog Product"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {editingId
                        ? "Update product pricing, stock count, and catalog attributes."
                        : "Register SKU variant, retail price, wholesale cost, and warranty baseline."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Product Name *
                    </label>
                    <Input
                      required
                      value={itemForm.name}
                      onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                      placeholder="e.g. Anker 65W GaN Fast Charger (Type-C)"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Brand / Manufacturer
                    </label>
                    <Input
                      value={itemForm.brand}
                      onChange={(e) => setItemForm({ ...itemForm, brand: e.target.value })}
                      placeholder="e.g. Anker, Samsung, Baseus"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Category *
                    </label>
                    <select
                      value={itemForm.category}
                      onChange={(e) =>
                        setItemForm({
                          ...itemForm,
                          category: e.target.value as DemoProduct["category"],
                        })
                      }
                      className="flex min-h-11 h-11 w-full rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm text-[#070B28] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#070B28]"
                    >
                      <option value="Smartphones">Smartphones</option>
                      <option value="Chargers">Chargers</option>
                      <option value="Earbuds">Earbuds</option>
                      <option value="Cables">Cables</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Laptops">Laptops</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      SKU Code *
                    </label>
                    <Input
                      required
                      value={itemForm.sku}
                      onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                      placeholder="e.g. ANK-65W-BLK"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Barcode
                    </label>
                    <Input
                      value={itemForm.barcode}
                      onChange={(e) => setItemForm({ ...itemForm, barcode: e.target.value })}
                      placeholder="e.g. 890123456015"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Cost Price (BDT) *
                    </label>
                    <Input
                      type="number"
                      required
                      min={0}
                      value={itemForm.costPrice}
                      onChange={(e) => setItemForm({ ...itemForm, costPrice: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Retail Selling Price (BDT) *
                    </label>
                    <Input
                      type="number"
                      required
                      min={0}
                      value={itemForm.price}
                      onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Current Stock Quantity
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={itemForm.stock}
                      onChange={(e) => setItemForm({ ...itemForm, stock: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Warranty Coverage
                    </label>
                    <Input
                      value={itemForm.warranty}
                      onChange={(e) => setItemForm({ ...itemForm, warranty: e.target.value })}
                      placeholder="e.g. 1 Year Official Replacement"
                    />
                  </div>
                </div>

                {/* Modal Action Buttons */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setIsModalOpen(false)}
                    className="min-h-12 h-12 px-6 text-base font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="min-h-12 h-12 px-8 text-base font-semibold bg-[#0052FF] hover:bg-[#0047E0] text-white shadow-xs cursor-pointer"
                  >
                    {editingId ? "Update Product" : "Save Product to Catalog"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Add or Edit Product Category */}
      <AnimatePresence>
        {isCatModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCatModalOpen(false)}
              className="fixed inset-0 bg-[#070B28]/60 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-[#0052FF]">
                    <Tag className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-[#070B28]">
                      {editingCatId ? "Edit Product Category" : "Add New Category"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {editingCatId
                        ? "Update category taxonomy, slug, and descriptions."
                        : "Create a new department group to organize inventory items."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Category Name *
                  </label>
                  <Input
                    required
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    placeholder="e.g. Wireless Audio"
                    className="min-h-11 h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Slug / URL Code
                  </label>
                  <Input
                    value={catForm.slug}
                    onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                    placeholder="e.g. wireless-audio (auto-generated if empty)"
                    className="min-h-11 h-11 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Description
                  </label>
                  <Input
                    value={catForm.description}
                    onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                    placeholder="Short description of products under this category"
                    className="min-h-11 h-11"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setIsCatModalOpen(false)}
                    className="min-h-12 h-12 px-6 text-base font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="min-h-12 h-12 px-8 text-base font-semibold bg-[#0052FF] hover:bg-[#0047E0] text-white shadow-xs cursor-pointer"
                  >
                    {editingCatId ? "Update Category" : "Create Category"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: Delete Product Confirmation Modal                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isDeleteProdModalOpen && productToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-100"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#070B28]">
                    Delete Product from Catalog?
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    Are you sure you want to remove{" "}
                    <span className="font-semibold text-[#070B28]">{productToDelete.name}</span> (SKU:{" "}
                    <span className="font-mono font-bold text-[#070B28]">{productToDelete.sku}</span>)?
                    This will permanently delete it from inventory and POS terminal lookup.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeleteProdModalOpen(false)}
                  className="min-h-10 h-10 px-4 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmDeleteProduct}
                  className="min-h-10 h-10 px-5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                >
                  Confirm & Delete SKU
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: Delete Category Confirmation Modal                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isDeleteCatModalOpen && categoryToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-100"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#070B28]">
                    Delete Category Group?
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    Are you sure you want to delete the category{" "}
                    <span className="font-semibold text-[#070B28]">{categoryToDelete.name}</span>?
                    Products previously classified under this department will need reassignment.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeleteCatModalOpen(false)}
                  className="min-h-10 h-10 px-4 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmDeleteCategory}
                  className="min-h-10 h-10 px-5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                >
                  Confirm & Delete Category
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
