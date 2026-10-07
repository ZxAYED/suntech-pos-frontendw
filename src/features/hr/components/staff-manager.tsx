"use client";

import { useState } from "react";
import {
  KeyRound,
  Plus,
  Search,
  UserCheck,
  Users,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MockStaffMember {
  id: string;
  name: string;
  publicId: string;
  email: string;
  role: string;
  assignedStation: string;
  hourlyRate: string;
  todaySales: string;
  status: "On Shift" | "Available" | "Off Duty";
}

const mockStaff: MockStaffMember[] = [
  {
    id: "st-1",
    name: "Alex Rivera",
    publicId: "CSH-104",
    email: "alex.rivera@suntech.pos",
    role: "Senior Cashier",
    assignedStation: "Lane 01 (Front Register)",
    hourlyRate: "$19.50/hr",
    todaySales: "$4,120.50",
    status: "On Shift",
  },
  {
    id: "st-2",
    name: "Sarah Chen",
    publicId: "CSH-108",
    email: "sarah.chen@suntech.pos",
    role: "Cashier",
    assignedStation: "Lane 02 (Express Checkout)",
    hourlyRate: "$17.50/hr",
    todaySales: "$3,450.00",
    status: "On Shift",
  },
  {
    id: "st-3",
    name: "Marcus Vance",
    publicId: "CSH-112",
    email: "marcus.v@suntech.pos",
    role: "Cashier",
    assignedStation: "Lane 03 (Drive-thru / Pickup)",
    hourlyRate: "$17.50/hr",
    todaySales: "$2,890.00",
    status: "On Shift",
  },
  {
    id: "st-4",
    name: "Elena Rostova",
    publicId: "CSH-115",
    email: "elena.r@suntech.pos",
    role: "Shift Supervisor",
    assignedStation: "Floater / Customer Service",
    hourlyRate: "$22.00/hr",
    todaySales: "$850.00",
    status: "Available",
  },
  {
    id: "st-5",
    name: "David Kim",
    publicId: "CSH-119",
    email: "david.kim@suntech.pos",
    role: "Store Admin",
    assignedStation: "Operations Office",
    hourlyRate: "$28.00/hr",
    todaySales: "$0.00",
    status: "Available",
  },
  {
    id: "st-6",
    name: "Rachel Green",
    publicId: "CSH-124",
    email: "rachel.g@suntech.pos",
    role: "Trainee Cashier",
    assignedStation: "Unassigned",
    hourlyRate: "$16.00/hr",
    todaySales: "$0.00",
    status: "Off Duty",
  },
];

export function StaffManager() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = mockStaff.filter(
    (s) =>
      search === "" ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.publicId.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4 animate-smooth-in">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#070B28]">Staff Provisioning</h1>
            <Badge variant="outline" className="border-slate-200 text-xs">
              6 Active Roster
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Issue cashier public IDs, assign lane stations, and audit daily sales performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1.5 bg-[#0052FF] text-white hover:bg-[#0047E0]">
                <Plus className="h-3.5 w-3.5" />
                <span>Provision Cashier</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Provision New Cashier</DialogTitle>
                <DialogDescription>
                  Mint a public ID and 4-digit terminal unlock PIN for a store employee.
                </DialogDescription>
              </DialogHeader>
              <form
                className="space-y-3 pt-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setModalOpen(false);
                }}
              >
                <div>
                  <label className="text-xs font-semibold text-slate-700">Full Name</label>
                  <Input placeholder="e.g. Jordan Bailey" className="h-8 mt-1 text-xs" required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Public ID</label>
                  <Input placeholder="CSH-130" className="h-8 mt-1 font-mono text-xs" required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">4-Digit Terminal PIN</label>
                  <Input type="password" maxLength={4} placeholder="••••" className="h-8 mt-1 font-mono text-xs" required />
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-[#0052FF] text-white">
                    Confirm & Mint ID
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-3 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cashiers on Shift</span>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-700">Live</span>
            </div>
          </div>
          <p className="font-mono text-2xl font-bold text-[#070B28] mt-1 tabular-nums">3 Lanes</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Lanes 01, 02, and 03 active</p>
        </Card>

        <Card className="p-3 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Staff Roster</span>
            <Users className="h-4 w-4 text-[#0052FF]" />
          </div>
          <p className="font-mono text-2xl font-bold text-[#070B28] mt-1 tabular-nums">6 Operators</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">5 Certified Cashiers, 1 Admin</p>
        </Card>

        <Card className="p-3 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Leader Throughput</span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="font-mono text-2xl font-bold text-[#070B28] mt-1 tabular-nums">$4,120.50</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Alex Rivera (98 transactions)</p>
        </Card>
      </div>

      {/* Staff Search Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, or role..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Staff Roster Table */}
      <Card className="border border-border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70 border-b border-border">
              <TableHead className="text-xs">Employee Name</TableHead>
              <TableHead className="text-xs">Public Cashier ID</TableHead>
              <TableHead className="text-xs">Role</TableHead>
              <TableHead className="text-xs">Station / Assigned Lane</TableHead>
              <TableHead className="text-xs">Rate</TableHead>
              <TableHead className="text-right text-xs">Today Sales</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-right text-xs">Security</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((person) => (
              <TableRow key={person.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-700">
                      {person.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#070B28]">{person.name}</p>
                      <p className="text-[10px] text-muted-foreground">{person.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs font-bold text-[#0052FF] tabular-nums">
                  {person.publicId}
                </TableCell>
                <TableCell className="text-xs font-medium text-slate-700">
                  {person.role}
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  {person.assignedStation}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">
                  {person.hourlyRate}
                </TableCell>
                <TableCell className="font-mono text-xs font-bold text-[#070B28] text-right tabular-nums">
                  {person.todaySales}
                </TableCell>
                <TableCell className="text-xs">
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold ${
                      person.status === "On Shift"
                        ? "bg-emerald-50 text-emerald-700"
                        : person.status === "Available"
                          ? "bg-blue-50 text-[#0052FF]"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {person.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500 hover:text-slate-800 gap-1">
                    <KeyRound className="h-3 w-3" />
                    <span>Reset PIN</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
