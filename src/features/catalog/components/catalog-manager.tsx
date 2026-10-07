"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { CurrencyInput } from "@/components/common/currency-input";
import { DataTable } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCentsToCurrency } from "@/lib/utils";
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useCreateProductMutation,
  useCreateVariantMutation,
  useProductsQuery,
  useSearchVariantsQuery,
} from "@/redux/api/catalogApi";
import type { Variant } from "@/types/domain";

const columns: LegacyColumnDef<Variant, unknown>[] = [
  { accessorKey: "productName", header: "Product" },
  { accessorKey: "name", header: "Variant" },
  { accessorKey: "sku", header: "SKU" },
  { accessorKey: "barcode", header: "Barcode" },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => formatCentsToCurrency(row.original.price),
  },
];

export function CatalogManager() {
  const [search, setSearch] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [variantOpen, setVariantOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [productName, setProductName] = useState("");
  const [productCategoryId, setProductCategoryId] = useState("");
  const [variant, setVariant] = useState({
    productId: "",
    name: "",
    sku: "",
    barcode: "",
    price: 0,
  });

  const categories = useCategoriesQuery();
  const products = useProductsQuery();
  const variants = useSearchVariantsQuery({ search: search || undefined });
  const createCategory = useCreateCategoryMutation();
  const createProduct = useCreateProductMutation();
  const createVariant = useCreateVariantMutation();

  return (
    <div>
      <PageHeader
        title="Catalog"
        accent="control"
        description="Categories, products, barcodes, and integer prices."
        actions={
          <>
            <Button variant="outline" onClick={() => setCategoryOpen(true)}>
              Add category
            </Button>
            <Button variant="outline" onClick={() => setProductOpen(true)}>
              Add product
            </Button>
            <Button onClick={() => setVariantOpen(true)}>Add variant</Button>
          </>
        }
      />
      <DataTable
        columns={columns}
        data={variants.data ?? []}
        loading={variants.isLoading}
        searchPlaceholder="Search variants"
        searchValue={search}
        onSearchChange={setSearch}
      />

      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
          </DialogHeader>
          <Input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Name" />
          <Button
            className="mt-3"
            loading={createCategory.isPending}
            onClick={async () => {
              try {
                await createCategory.mutateAsync({ name: categoryName });
                setCategoryName("");
                setCategoryOpen(false);
                toast.success("Category created");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Unable to create category");
              }
            }}
          >
            Save
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={productOpen} onOpenChange={setProductOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New product</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="Product name" />
            <Select value={productCategoryId} onValueChange={setProductCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {(categories.data ?? []).map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              loading={createProduct.isPending}
              onClick={async () => {
                try {
                  await createProduct.mutateAsync({ name: productName, categoryId: productCategoryId });
                  setProductName("");
                  setProductOpen(false);
                  toast.success("Product created");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to create product");
                }
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={variantOpen} onOpenChange={setVariantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New variant</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={variant.productId} onValueChange={(productId) => setVariant((current) => ({ ...current, productId }))}>
              <SelectTrigger>
                <SelectValue placeholder="Product" />
              </SelectTrigger>
              <SelectContent>
                {(products.data ?? []).map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Variant name" value={variant.name} onChange={(event) => setVariant((current) => ({ ...current, name: event.target.value }))} />
            <Input placeholder="SKU" value={variant.sku} onChange={(event) => setVariant((current) => ({ ...current, sku: event.target.value }))} />
            <Input placeholder="Barcode" value={variant.barcode} onChange={(event) => setVariant((current) => ({ ...current, barcode: event.target.value }))} />
            <CurrencyInput value={variant.price} onChange={(price) => setVariant((current) => ({ ...current, price }))} />
            <Button
              loading={createVariant.isPending}
              onClick={async () => {
                try {
                  await createVariant.mutateAsync(variant);
                  setVariant({ productId: "", name: "", sku: "", barcode: "", price: 0 });
                  setVariantOpen(false);
                  toast.success("Variant created");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to create variant");
                }
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
