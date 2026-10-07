"use client";

import { useState } from "react";
import {
  Boxes,
  Download,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MockCatalogItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  barcode: string;
  cost: string;
  price: string;
  margin: string;
  stock: number;
  status: "Active" | "Low Stock" | "Draft";
}

const mockCatalog: MockCatalogItem[] = [
  {
    id: "cat-1",
    name: "Logitech MX Master 3S Wireless Mouse",
    sku: "PER-9021",
    category: "Peripherals",
    barcode: "097855172289",
    cost: "$55.00",
    price: "$99.99",
    margin: "+45.0%",
    stock: 24,
    status: "Active",
  },
  {
    id: "cat-2",
    name: "Keychron K2 RGB Mechanical Keyboard (Brown Switch)",
    sku: "KEY-4410",
    category: "Keyboards",
    barcode: "840134410921",
    cost: "$48.00",
    price: "$89.50",
    margin: "+46.4%",
    stock: 15,
    status: "Active",
  },
  {
    id: "cat-3",
    name: "Anker 8-in-1 USB-C Multi-Port Adapter Hub",
    sku: "HUB-1180",
    category: "Cables & Hubs",
    barcode: "194644011802",
    cost: "$22.50",
    price: "$49.99",
    margin: "+55.0%",
    stock: 32,
    status: "Active",
  },
  {
    id: "cat-4",
    name: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    sku: "AUD-7720",
    category: "Audio",
    barcode: "027242923508",
    cost: "$210.00",
    price: "$348.00",
    margin: "+39.7%",
    stock: 6,
    status: "Low Stock",
  },
  {
    id: "cat-5",
    name: "Razer Gigantus V2 Ergonomic Large Desk Mat",
    sku: "ACC-3312",
    category: "Accessories",
    barcode: "811659033124",
    cost: "$12.00",
    price: "$29.99",
    margin: "+60.0%",
    stock: 40,
    status: "Active",
  },
  {
    id: "cat-6",
    name: "Elgato Facecam 1080p60 Studio Webcam",
    sku: "CAM-5501",
    category: "Peripherals",
    barcode: "840006655019",
    cost: "$75.00",
    price: "$129.99",
    margin: "+42.3%",
    stock: 5,
    status: "Low Stock",
  },
  {
    id: "cat-7",
    name: "CalDigit TS4 Thunderbolt 4 Docking Station",
    sku: "HUB-9901",
    category: "Cables & Hubs",
    barcode: "850012399014",
    cost: "$280.00",
    price: "$399.99",
    margin: "+30.0%",
    stock: 11,
    status: "Active",
  },
];

const categoryList = ["All Items", "Peripherals", "Keyboards", "Audio", "Cables & Hubs", "Accessories"];

export function CatalogManager() {
  const [selectedCat, setSelectedCat] = useState("All Items");
  const [search, setSearch] = useState("");

  const filtered = mockCatalog.filter((item) => {
    const matchCat = selectedCat === "All Items" || item.category === selectedCat;
    const matchSearch =
      search === "" ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.barcode.includes(search);
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-4 animate-smooth-in">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#070B28]">Catalog Control</h1>
            <Badge variant="outline" className="border-slate-200 text-xs">
              48 Total SKUs
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage product lines, barcode registry, wholesale costs, and retail margins.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
          <Button size="sm" className="h-8 gap-1.5 bg-[#0052FF] text-white hover:bg-[#0047E0]">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      {/* 4 Overview Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-3 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active SKUs</span>
            <Boxes className="h-4 w-4 text-[#0052FF]" />
          </div>
          <p className="font-mono text-xl font-bold text-[#070B28] mt-1 tabular-nums">48</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">6 Active Categories</p>
        </Card>
        <Card className="p-3 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Inventory Value</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="font-mono text-xl font-bold text-[#070B28] mt-1 tabular-nums">$38,420.00</p>
          <p className="text-[10px] text-emerald-600 mt-0.5">+4.8% vs last cycle</p>
        </Card>
        <Card className="p-3 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Average Margin</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">+46.2%</span>
          </div>
          <p className="font-mono text-xl font-bold text-[#070B28] mt-1 tabular-nums">46.2%</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Target: 40.0% min</p>
        </Card>
        <Card className="p-3 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Low Stock Alert</span>
            <Badge variant="pending" className="text-[10px] px-1 py-0">2 items</Badge>
          </div>
          <p className="font-mono text-xl font-bold text-amber-600 mt-1 tabular-nums">2</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Requires restock PO</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {categoryList.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCat(cat)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedCat === cat
                  ? "bg-[#0052FF] text-white"
                  : "border border-border bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, or barcode..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Product Table */}
      <Card className="border border-border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70 border-b border-border">
              <TableHead className="text-xs">Product Name</TableHead>
              <TableHead className="text-xs">SKU</TableHead>
              <TableHead className="text-xs">Barcode</TableHead>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-right text-xs">Cost</TableHead>
              <TableHead className="text-right text-xs">Retail Price</TableHead>
              <TableHead className="text-right text-xs">Margin</TableHead>
              <TableHead className="text-right text-xs">Stock</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                <TableCell className="font-medium text-xs text-[#070B28]">
                  {item.name}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">
                  {item.sku}
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-600 tabular-nums">
                  {item.barcode}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {item.category}
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-500 text-right tabular-nums">
                  {item.cost}
                </TableCell>
                <TableCell className="font-mono text-xs font-bold text-[#0052FF] text-right tabular-nums">
                  {item.price}
                </TableCell>
                <TableCell className="font-mono text-xs font-semibold text-emerald-600 text-right tabular-nums">
                  {item.margin}
                </TableCell>
                <TableCell className="font-mono text-xs text-right tabular-nums font-semibold">
                  <span className={item.stock < 10 ? "text-amber-600" : "text-[#070B28]"}>
                    {item.stock}
                  </span>
                </TableCell>
                <TableCell className="text-xs">
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold ${
                      item.status === "Active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
