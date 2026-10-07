"use client";

import { useState } from "react";
import {
  DollarSign,
  Download,
  FileCheck,
  Plus,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MockAdvance {
  id: string;
  date: string;
  cashierName: string;
  publicId: string;
  reason: string;
  approvedBy: string;
  status: "Approved & Deducted" | "Pending Review";
  amount: string;
}

const mockAdvances: MockAdvance[] = [
  {
    id: "adv-1",
    date: "Oct 14, 2026",
    cashierName: "Alex Rivera",
    publicId: "CSH-104",
    reason: "Emergency medical transport stipend",
    approvedBy: "David Kim (Admin)",
    status: "Approved & Deducted",
    amount: "-$250.00",
  },
  {
    id: "adv-2",
    date: "Oct 08, 2026",
    cashierName: "Sarah Chen",
    publicId: "CSH-108",
    reason: "Transit monthly pass subsidy advance",
    approvedBy: "David Kim (Admin)",
    status: "Approved & Deducted",
    amount: "-$120.00",
  },
  {
    id: "adv-3",
    date: "Oct 02, 2026",
    cashierName: "Marcus Vance",
    publicId: "CSH-112",
    reason: "Store uniform replacement expense",
    approvedBy: "Elena Rostova (Supervisor)",
    status: "Approved & Deducted",
    amount: "-$75.00",
  },
];

const mockCashiers = [
  { id: "all", name: "All Store Employees (6 Roster)" },
  { id: "csh-104", name: "Alex Rivera (CSH-104 - Senior Cashier)" },
  { id: "csh-108", name: "Sarah Chen (CSH-108 - Cashier)" },
  { id: "csh-112", name: "Marcus Vance (CSH-112 - Cashier)" },
  { id: "csh-115", name: "Elena Rostova (CSH-115 - Supervisor)" },
];

export function PayrollManager() {
  const [cashierId, setCashierId] = useState("csh-104");
  const [month, setMonth] = useState("10");
  const [year, setYear] = useState("2026");

  return (
    <div className="space-y-4 animate-smooth-in">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#070B28]">Payroll & Advances</h1>
            <Badge variant="outline" className="border-slate-200 text-xs">
              Cycle: October 2026
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit staff advance ledgers, hourly wage settlements, and reconcile net disbursements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            <span>Pay Slip Batch</span>
          </Button>
          <Button size="sm" className="h-8 gap-1.5 bg-[#0052FF] text-white hover:bg-[#0047E0]">
            <Plus className="h-3.5 w-3.5" />
            <span>Record Advance</span>
          </Button>
        </div>
      </div>

      {/* Beautified Select Filter Strip */}
      <Card className="p-3 border border-border bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-72">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Filter Employee
            </label>
            <Select value={cashierId} onValueChange={setCashierId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {mockCashiers.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-40">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Pay Month
            </label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="9">September</SelectItem>
                <SelectItem value="10">October</SelectItem>
                <SelectItem value="11">November</SelectItem>
                <SelectItem value="12">December</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-32">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Fiscal Year
            </label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2027">2027</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* 3 Metric Cards for Selected Employee / Cycle */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-3.5 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Gross Monthly Base
            </span>
            <DollarSign className="h-4 w-4 text-[#0052FF]" />
          </div>
          <p className="font-mono text-2xl font-bold text-[#070B28] mt-1 tabular-nums">$3,400.00</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Based on 174 regular duty hours ($19.50/hr)</p>
        </Card>

        <Card className="p-3.5 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Cycle Advances
            </span>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
              1 Advance Active
            </span>
          </div>
          <p className="font-mono text-2xl font-bold text-rose-600 mt-1 tabular-nums">-$250.00</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Approved deduction for Oct 14</p>
        </Card>

        <Card className="p-3.5 border border-border shadow-sm bg-blue-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0052FF]">
              Net Disbursable Pay
            </span>
            <Wallet className="h-4 w-4 text-[#0052FF]" />
          </div>
          <p className="font-mono text-2xl font-bold text-[#0052FF] mt-1 tabular-nums">$3,150.00</p>
          <p className="text-[11px] text-slate-600 mt-0.5">Scheduled for direct EFT transfer</p>
        </Card>
      </div>

      {/* Advance Ledger Table */}
      <Card className="border border-border bg-white shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-[#070B28]">Salary Advance Ledger</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Audited cash deductions and shift loan balance records.
            </p>
          </div>
          <Badge variant="outline" className="text-xs">3 Logged Records</Badge>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70 border-b border-border">
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Employee</TableHead>
              <TableHead className="text-xs">Reason / Purpose</TableHead>
              <TableHead className="text-xs">Approved By</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-right text-xs">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockAdvances.map((adv) => (
              <TableRow key={adv.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">
                  {adv.date}
                </TableCell>
                <TableCell>
                  <span className="text-xs font-semibold text-[#070B28]">{adv.cashierName}</span>
                  <span className="ml-1.5 font-mono text-[10px] text-muted-foreground tabular-nums">
                    ({adv.publicId})
                  </span>
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  {adv.reason}
                </TableCell>
                <TableCell className="text-xs text-slate-500">
                  {adv.approvedBy}
                </TableCell>
                <TableCell className="text-xs">
                  <span className="inline-flex items-center rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    {adv.status}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs font-bold text-rose-600 text-right tabular-nums">
                  {adv.amount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Process Payroll Primary Action Bar */}
      <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3 shadow-sm">
        <div>
          <p className="text-xs font-semibold text-[#070B28]">Ready for Settlement</p>
          <p className="text-[11px] text-muted-foreground">
            Net disbursement calculated for Alex Rivera: <span className="font-mono font-bold text-[#070B28] tabular-nums">$3,150.00</span>
          </p>
        </div>
        <Button
          size="sm"
          className="h-9 px-4 gap-1.5 bg-[#0052FF] text-white hover:bg-[#0047E0] text-xs font-semibold"
          onClick={() => toast.success("Payroll settlement processed successfully ($3,150.00)")}
        >
          <FileCheck className="h-4 w-4" />
          <span>Process Net Payroll ($3,150.00)</span>
        </Button>
      </div>
    </div>
  );
}
