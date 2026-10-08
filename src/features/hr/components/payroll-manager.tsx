"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  FileCheck,
  HandCoins,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { DataPagination } from "@/components/common/data-pagination";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  demoAdvances,
  demoPayroll,
  type DemoAdvanceItem,
  type DemoPayrollItem,
} from "@/demo/payroll";

export function PayrollManager() {
  const [activeTab, setActiveTab] = useState<"summary" | "advances">("summary");
  const [payrollItems, setPayrollItems] = useState<DemoPayrollItem[]>(demoPayroll);
  const [advancesList, setAdvancesList] = useState<DemoAdvanceItem[]>(demoAdvances);

  // Pagination States
  const [summaryPage, setSummaryPage] = useState(1);
  const [summaryPageSize, setSummaryPageSize] = useState(6);
  const totalSummaryPages = Math.ceil(payrollItems.length / summaryPageSize) || 1;
  const paginatedPayroll = payrollItems.slice(
    (summaryPage - 1) * summaryPageSize,
    summaryPage * summaryPageSize,
  );

  const [advancesPage, setAdvancesPage] = useState(1);
  const [advancesPageSize, setAdvancesPageSize] = useState(6);
  const totalAdvancesPages = Math.ceil(advancesList.length / advancesPageSize) || 1;
  const paginatedAdvances = advancesList.slice(
    (advancesPage - 1) * advancesPageSize,
    advancesPage * advancesPageSize,
  );

  // Modal States
  // 1. Edit Salary Modal
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<DemoPayrollItem | null>(null);
  const [salaryForm, setSalaryForm] = useState({
    baseSalary: 0,
    allowances: 0,
    overtimePay: 0,
  });

  // 2. Record New Advance Modal
  const [isRecordAdvanceModalOpen, setIsRecordAdvanceModalOpen] = useState(false);
  const [newAdvanceForm, setNewAdvanceForm] = useState({
    employeeName: "",
    employeeCode: "",
    role: "Cashier",
    advanceAmount: 10000,
    monthlyDeduction: 2500,
    reason: "",
  });

  // 3. Modify Advance Terms Modal
  const [isEditAdvanceModalOpen, setIsEditAdvanceModalOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<DemoAdvanceItem | null>(null);
  const [editAdvanceForm, setEditAdvanceForm] = useState({
    advanceAmount: 0,
    monthlyDeduction: 0,
    remainingBalance: 0,
    status: "APPROVED" as DemoAdvanceItem["status"],
    reason: "",
  });

  // 4. Void Advance Confirmation Modal
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [advanceToVoid, setAdvanceToVoid] = useState<DemoAdvanceItem | null>(null);

  const totalPayroll = payrollItems.reduce((acc, p) => acc + p.netSalary, 0);
  const totalAdvancesActive = advancesList
    .filter((a) => a.status === "APPROVED")
    .reduce((acc, a) => acc + a.remainingBalance, 0);

  // Handlers for Salary
  const handleOpenSalaryModal = (pay: DemoPayrollItem) => {
    setEditingSalary(pay);
    setSalaryForm({
      baseSalary: pay.baseSalary,
      allowances: pay.allowances,
      overtimePay: pay.overtimePay,
    });
    setIsSalaryModalOpen(true);
  };

  const handleSaveSalary = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSalary) return;
    const base = Number(salaryForm.baseSalary) || 0;
    const allow = Number(salaryForm.allowances) || 0;
    const ot = Number(salaryForm.overtimePay) || 0;
    const newNet = base + allow + ot - editingSalary.deductions;

    setPayrollItems((prev) =>
      prev.map((p) =>
        p.id === editingSalary.id
          ? {
              ...p,
              baseSalary: base,
              allowances: allow,
              overtimePay: ot,
              netSalary: newNet,
            }
          : p,
      ),
    );
    toast.success(
      `Updated compensation for ${editingSalary.employeeName}. Net salary: ${newNet.toLocaleString("en-BD")} BDT`,
    );
    setIsSalaryModalOpen(false);
  };

  // Handlers for Advances
  const handleOpenRecordAdvanceModal = () => {
    setNewAdvanceForm({
      employeeName: "",
      employeeCode: `ST-EMP-${Math.floor(100 + Math.random() * 900)}`,
      role: "Cashier",
      advanceAmount: 10000,
      monthlyDeduction: 2500,
      reason: "",
    });
    setIsRecordAdvanceModalOpen(true);
  };

  const handleSaveNewAdvance = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newAdvanceForm.employeeName.trim()) {
      toast.error("Employee name is required");
      return;
    }
    const amount = Number(newAdvanceForm.advanceAmount) || 0;
    const deduction = Number(newAdvanceForm.monthlyDeduction) || 0;
    if (amount <= 0) {
      toast.error("Advance amount must be greater than 0");
      return;
    }
    const newAdv: DemoAdvanceItem = {
      id: `adv-${Date.now()}`,
      employeeName: newAdvanceForm.employeeName.trim(),
      employeeCode: newAdvanceForm.employeeCode.trim() || "ST-EMP-NEW",
      role: newAdvanceForm.role,
      requestDate: "Oct 08, 2026",
      advanceAmount: amount,
      monthlyDeduction: deduction,
      remainingBalance: amount,
      reason: newAdvanceForm.reason.trim() || "Urgent Employee Advance Request",
      status: "APPROVED",
    };

    setAdvancesList((prev) => [newAdv, ...prev]);
    toast.success(
      `Created cash advance of ${amount.toLocaleString("en-BD")} BDT for ${newAdv.employeeName}`,
    );
    setIsRecordAdvanceModalOpen(false);
  };

  const handleOpenEditAdvanceModal = (adv: DemoAdvanceItem) => {
    setEditingAdvance(adv);
    setEditAdvanceForm({
      advanceAmount: adv.advanceAmount,
      monthlyDeduction: adv.monthlyDeduction,
      remainingBalance: adv.remainingBalance,
      status: adv.status,
      reason: adv.reason,
    });
    setIsEditAdvanceModalOpen(true);
  };

  const handleSaveEditAdvance = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAdvance) return;
    const amount = Number(editAdvanceForm.advanceAmount) || 0;
    const deduction = Number(editAdvanceForm.monthlyDeduction) || 0;
    const balance = Number(editAdvanceForm.remainingBalance) || 0;

    setAdvancesList((prev) =>
      prev.map((a) =>
        a.id === editingAdvance.id
          ? {
              ...a,
              advanceAmount: amount,
              monthlyDeduction: deduction,
              remainingBalance: balance,
              status: editAdvanceForm.status,
              reason: editAdvanceForm.reason,
            }
          : a,
      ),
    );
    toast.success(`Updated repayment terms for ${editingAdvance.employeeName}`);
    setIsEditAdvanceModalOpen(false);
  };

  const handleOpenVoidModal = (adv: DemoAdvanceItem) => {
    setAdvanceToVoid(adv);
    setIsVoidModalOpen(true);
  };

  const handleConfirmVoidAdvance = () => {
    if (!advanceToVoid) return;
    setAdvancesList((prev) => prev.filter((a) => a.id !== advanceToVoid.id));
    toast.warning(`Voided cash advance ledger record for ${advanceToVoid.employeeName}`);
    setIsVoidModalOpen(false);
    setAdvanceToVoid(null);
  };

  return (
    <div className="space-y-6 font-sans select-none">
      {/* ═══ Row 1: The Main Header (Title + Actions ONLY) ═══ */}
      <PageHeader
        title="Payroll & Advance Ledger"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => toast.info("Exporting payroll bank statement (CSV)...")}
              className="min-h-11 h-11 px-5 border-slate-200 text-sm font-medium text-[#070B28] bg-white hover:bg-slate-50 cursor-pointer shadow-xs gap-2"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>Bank Statement</span>
            </Button>

            {activeTab === "advances" ? (
              <Button
                size="lg"
                onClick={handleOpenRecordAdvanceModal}
                className="min-h-12 h-12 px-7 bg-[#0052FF] hover:bg-[#0047E0] text-white text-base font-medium cursor-pointer shadow-xs gap-2"
              >
                <Plus className="h-5 w-5" />
                <span>Record Advance</span>
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => toast.success("Processed net salary disbursement (POST /payroll/process)")}
                className="min-h-12 h-12 px-7 bg-[#0052FF] hover:bg-[#0047E0] text-white text-base font-medium cursor-pointer shadow-xs gap-2"
              >
                <FileCheck className="h-5 w-5" />
                <span>Disburse Payroll</span>
              </Button>
            )}
          </>
        }
      />

      {/* ═══ Row 2: The Toolbar / Sub-navigation (mb-6) ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            className={`px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${
              activeTab === "summary"
                ? "bg-[#0052FF] text-white shadow-xs"
                : "text-slate-600 hover:text-[#070B28] hover:bg-slate-100"
            }`}
          >
            Salary Summaries ({payrollItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("advances")}
            className={`px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${
              activeTab === "advances"
                ? "bg-[#0052FF] text-white shadow-xs"
                : "text-slate-600 hover:text-[#070B28] hover:bg-slate-100"
            }`}
          >
            Advance Ledger ({advancesList.length})
          </button>
        </div>
      </div>

      {/* ═══ Main Content: Summaries or Advance Ledger ═══ */}
      {activeTab === "summary" ? (
        <>
          {/* Payroll KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-medium block">
                  Total Monthly Payroll
                </span>
                <Wallet className="h-4 w-4 text-[#0052FF]" />
              </div>
              <p className="mt-2 font-mono text-3xl font-bold text-[#070B28] tabular-nums">
                {totalPayroll.toLocaleString("en-BD")}{" "}
                <span className="text-sm font-normal text-slate-500">BDT</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Calculated across 4 staff members</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-medium block">
                  Disbursement Status
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <p className="mt-2 text-3xl font-bold text-emerald-600">Disbursed</p>
              <p className="mt-1 text-xs text-slate-500">Completed via BEFTN Bank Transfer</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-medium block">
                  Total Allowances & Overtime
                </span>
                <span className="h-2 w-2 rounded-full bg-blue-500" />
              </div>
              <p className="mt-2 font-mono text-3xl font-bold text-[#070B28] tabular-nums">
                {payrollItems
                  .reduce((acc, p) => acc + p.allowances + p.overtimePay, 0)
                  .toLocaleString("en-BD")}{" "}
                <span className="text-sm font-normal text-slate-500">BDT</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Overtime + medical + food allowances</p>
            </div>
          </div>

          {/* High-Density Salary Summaries Table (GET /payroll) */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="w-full text-sm">
                <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-3.5 px-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Employee
                    </TableHead>
                    <TableHead className="py-3.5 px-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Role
                    </TableHead>
                    <TableHead className="py-3.5 px-4 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                      Base Salary
                    </TableHead>
                    <TableHead className="py-3.5 px-4 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                      Allowances
                    </TableHead>
                    <TableHead className="py-3.5 px-4 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                      Overtime (BDT)
                    </TableHead>
                    <TableHead className="py-3.5 px-4 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                      Net Pay (BDT)
                    </TableHead>
                    <TableHead className="py-3.5 px-4 text-center text-xs font-medium uppercase tracking-wider text-slate-400">
                      Status
                    </TableHead>
                    <TableHead className="py-3.5 px-4 text-right text-xs font-medium uppercase tracking-wider text-slate-400 w-28">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {paginatedPayroll.map((pay) => (
                    <TableRow key={pay.id} className="h-16 hover:bg-slate-50/70 transition-colors">
                      <TableCell className="py-3.5 px-4 text-left">
                        <p className="font-medium text-sm text-[#070B28] leading-tight">
                          {pay.employeeName}
                        </p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {pay.employeeCode}
                        </p>
                      </TableCell>

                      <TableCell className="py-3.5 px-4 text-left text-slate-700 font-medium text-xs sm:text-sm">
                        {pay.role}
                      </TableCell>

                      <TableCell className="py-3.5 px-4 text-right">
                        <span className="font-mono tabular-nums text-sm text-[#070B28]">
                          {pay.baseSalary.toLocaleString("en-BD")} BDT
                        </span>
                      </TableCell>

                      <TableCell className="py-3.5 px-4 text-right">
                        <span className="font-mono tabular-nums text-sm text-slate-600">
                          +{pay.allowances.toLocaleString("en-BD")} BDT
                        </span>
                      </TableCell>

                      <TableCell className="py-3.5 px-4 text-right">
                        <span className="font-mono tabular-nums text-sm text-slate-600">
                          +{pay.overtimePay.toLocaleString("en-BD")} BDT
                        </span>
                      </TableCell>

                      <TableCell className="py-3.5 px-4 text-right">
                        <span className="font-mono tabular-nums text-sm font-medium text-[#070B28]">
                          {pay.netSalary.toLocaleString("en-BD")} BDT
                        </span>
                      </TableCell>

                      <TableCell className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200/60">
                          PAID
                        </span>
                      </TableCell>

                      {/* Row Action Column: Direct Edit/Download + Dropdown */}
                      <TableCell className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Direct Edit Compensation Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenSalaryModal(pay)}
                            className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg text-slate-500 hover:text-[#0052FF] hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-colors cursor-pointer"
                            title="Edit Compensation & Allowances"
                            aria-label={`Edit compensation for ${pay.employeeName}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          {/* Direct Download Payslip Button */}
                          <button
                            type="button"
                            onClick={() => toast.success(`Downloaded payslip PDF for ${pay.employeeName}`)}
                            className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-colors cursor-pointer"
                            title="Download Payslip PDF"
                            aria-label={`Download payslip for ${pay.employeeName}`}
                          >
                            <Download className="h-4 w-4" />
                          </button>

                          {/* Dropdown Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg text-slate-400 hover:text-[#070B28] hover:bg-slate-100 cursor-pointer transition-colors"
                                title="Salary actions"
                                aria-label="Salary actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-white border-slate-200 shadow-xl rounded-lg p-1.5 z-50">
                              <DropdownMenuItem
                                onClick={() => toast.success(`Downloaded payslip PDF for ${pay.employeeName}`)}
                                className="flex items-center gap-2.5 py-2 px-3 text-xs font-medium text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                              >
                                <Download className="h-4 w-4 text-[#0052FF]" />
                                <span>Download PDF</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => toast.info(`Base: ${pay.baseSalary} BDT · Allowances: ${pay.allowances} BDT · Net: ${pay.netSalary} BDT`)}
                                className="flex items-center gap-2.5 py-2 px-3 text-xs font-medium text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                              >
                                <Eye className="h-4 w-4 text-slate-500" />
                                <span>View Breakdown</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenSalaryModal(pay)}
                                className="flex items-center gap-2.5 py-2 px-3 text-xs font-medium text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                              >
                                <Pencil className="h-4 w-4 text-slate-500" />
                                <span>Edit Allowances</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Reusable DataPagination for Salary Summaries */}
            <div className="border-t border-slate-200 bg-white px-4 py-1">
              <DataPagination
                currentPage={summaryPage}
                totalPages={totalSummaryPages}
                totalItems={payrollItems.length}
                pageSize={summaryPageSize}
                onPageChange={setSummaryPage}
                onPageSizeChange={(newSize) => {
                  setSummaryPageSize(newSize);
                  setSummaryPage(1);
                }}
                pageSizeOptions={[4, 6, 10, 20]}
                itemLabel="records"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Advance Ledger Metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block">
                  Active Outstanding Advances
                </span>
                <HandCoins className="h-4 w-4 text-[#0052FF]" />
              </div>
              <p className="mt-2 font-mono text-3xl font-bold text-[#070B28] tabular-nums">
                {totalAdvancesActive.toLocaleString("en-BD")}{" "}
                <span className="text-sm font-normal text-slate-500">BDT</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Recoverable via monthly payroll</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block">
                  Monthly Deductions (Recovery)
                </span>
                <span className="h-2 w-2 rounded-full bg-blue-500" />
              </div>
              <p className="mt-2 font-mono text-3xl font-bold text-[#070B28] tabular-nums">
                {advancesList
                  .filter((a) => a.status === "APPROVED")
                  .reduce((acc, a) => acc + a.monthlyDeduction, 0)
                  .toLocaleString("en-BD")}{" "}
                <span className="text-sm font-normal text-slate-500">BDT/mo</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Auto-deducted from net salary</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block">
                  Pending Advance Requests
                </span>
                <span className="h-2 w-2 rounded-full bg-amber-500" />
              </div>
              <p className="mt-2 font-mono text-3xl font-bold text-amber-600 tabular-nums">
                {advancesList.filter((a) => a.status === "PENDING").length}{" "}
                <span className="text-sm font-normal text-slate-500">Staff Requests</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Awaiting manager approval</p>
            </div>
          </div>

          {/* High-Density Advance Ledger Table (GET /payroll/advances) */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="w-full text-sm">
                <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-3.5 px-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Employee
                    </TableHead>
                    <TableHead className="py-3.5 px-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Request Date & Reason
                    </TableHead>
                    <TableHead className="py-3.5 px-4 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                      Advance (BDT)
                    </TableHead>
                    <TableHead className="py-3.5 px-4 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                      Monthly Deduction
                    </TableHead>
                    <TableHead className="py-3.5 px-4 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                      Remaining Balance
                    </TableHead>
                    <TableHead className="py-3.5 px-4 text-center text-xs font-medium uppercase tracking-wider text-slate-400">
                      Status
                    </TableHead>
                    <TableHead className="py-3.5 px-4 text-right text-xs font-medium uppercase tracking-wider text-slate-400 w-28">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {paginatedAdvances.map((adv) => (
                    <TableRow key={adv.id} className="h-16 hover:bg-slate-50/70 transition-colors">
                      <TableCell className="py-3.5 px-4 text-left">
                        <p className="font-medium text-sm text-[#070B28] leading-tight">
                          {adv.employeeName}
                        </p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {adv.employeeCode} · {adv.role}
                        </p>
                      </TableCell>

                      <TableCell className="py-3.5 px-4 text-left text-slate-700">
                        <p className="font-medium text-xs sm:text-sm text-[#070B28]">{adv.reason}</p>
                        <p className="text-xs text-slate-500">{adv.requestDate}</p>
                      </TableCell>

                      <TableCell className="py-3.5 px-4 text-right">
                        <span className="font-mono tabular-nums text-sm font-medium text-[#070B28]">
                          {adv.advanceAmount.toLocaleString("en-BD")} BDT
                        </span>
                      </TableCell>

                      <TableCell className="py-3.5 px-4 text-right">
                        <span className="font-mono tabular-nums text-sm text-slate-600">
                          {adv.monthlyDeduction.toLocaleString("en-BD")} BDT/mo
                        </span>
                      </TableCell>

                      <TableCell className="py-3.5 px-4 text-right">
                        <span className="font-mono tabular-nums text-sm font-medium text-[#0052FF]">
                          {adv.remainingBalance.toLocaleString("en-BD")} BDT
                        </span>
                      </TableCell>

                      <TableCell className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded border ${
                            adv.status === "APPROVED"
                              ? "text-emerald-700 bg-emerald-50 border-emerald-200/60"
                              : "text-amber-700 bg-amber-50 border-amber-200/60"
                          }`}
                        >
                          {adv.status}
                        </span>
                      </TableCell>

                      {/* Row Action Column: Direct Modify/Void + Dropdown */}
                      <TableCell className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Direct Modify / Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditAdvanceModal(adv)}
                            className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg text-slate-500 hover:text-[#0052FF] hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-colors cursor-pointer"
                            title="Modify Repayment Terms"
                            aria-label={`Modify terms for ${adv.employeeName}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          {/* Direct Void / Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenVoidModal(adv)}
                            className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                            title="Void Advance"
                            aria-label={`Void advance for ${adv.employeeName}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          {/* Dropdown Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg text-slate-400 hover:text-[#070B28] hover:bg-slate-100 cursor-pointer transition-colors"
                                title="Advance actions"
                                aria-label="Advance actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-white border-slate-200 shadow-xl rounded-lg p-1.5 z-50">
                              <DropdownMenuItem
                                onClick={() => {
                                  setAdvancesList((prev) =>
                                    prev.map((a) => (a.id === adv.id ? { ...a, status: "APPROVED" as const } : a)),
                                  );
                                  toast.success(`Approved advance request for ${adv.employeeName}`);
                                }}
                                className="flex items-center gap-2.5 py-2 px-3 text-xs font-medium text-emerald-600 hover:bg-emerald-50 cursor-pointer rounded-md transition-colors"
                              >
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                <span>Approve Advance</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenEditAdvanceModal(adv)}
                                className="flex items-center gap-2.5 py-2 px-3 text-xs font-medium text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                              >
                                <Pencil className="h-4 w-4 text-slate-500" />
                                <span>Modify Terms</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1 bg-slate-100" />
                              <DropdownMenuItem
                                onClick={() => handleOpenVoidModal(adv)}
                                className="flex items-center gap-2.5 py-2 px-3 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer rounded-md transition-colors"
                              >
                                <Trash2 className="h-4 w-4 text-rose-500" />
                                <span>Void Advance</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Reusable DataPagination for Advance Ledger */}
            <div className="border-t border-slate-200 bg-white px-4 py-1">
              <DataPagination
                currentPage={advancesPage}
                totalPages={totalAdvancesPages}
                totalItems={advancesList.length}
                pageSize={advancesPageSize}
                onPageChange={setAdvancesPage}
                onPageSizeChange={(newSize) => {
                  setAdvancesPageSize(newSize);
                  setAdvancesPage(1);
                }}
                pageSizeOptions={[4, 6, 10, 20]}
                itemLabel="advances"
              />
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: Edit Compensation & Allowances Modal                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isSalaryModalOpen && editingSalary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#0052FF]">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#070B28]">
                      Edit Compensation Structure
                    </h2>
                    <p className="text-xs text-slate-500">
                      {editingSalary.employeeName} · {editingSalary.employeeCode} ({editingSalary.role})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSalaryModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveSalary} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                    Base Salary (BDT) *
                  </label>
                  <Input
                    required
                    type="number"
                    min="0"
                    step="500"
                    value={salaryForm.baseSalary}
                    onChange={(e) =>
                      setSalaryForm({ ...salaryForm, baseSalary: Number(e.target.value) })
                    }
                    className="min-h-11 h-11 font-mono text-sm"
                  />
                  <p className="text-[11px] text-slate-400">Core contracted monthly gross salary.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Allowances (BDT)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={salaryForm.allowances}
                      onChange={(e) =>
                        setSalaryForm({ ...salaryForm, allowances: Number(e.target.value) })
                      }
                      className="min-h-11 h-11 font-mono text-sm"
                    />
                    <p className="text-[11px] text-slate-400">Housing, medical & food allowance.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Overtime Pay (BDT)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={salaryForm.overtimePay}
                      onChange={(e) =>
                        setSalaryForm({ ...salaryForm, overtimePay: Number(e.target.value) })
                      }
                      className="min-h-11 h-11 font-mono text-sm"
                    />
                    <p className="text-[11px] text-slate-400">Extra hours & holiday shifts pay.</p>
                  </div>
                </div>

                {/* Net Pay Calculation Preview Card */}
                <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Calculated Net Pay
                    </p>
                    <p className="text-xs text-slate-400">
                      Base + Allowances + Overtime - Deductions ({editingSalary.deductions} BDT)
                    </p>
                  </div>
                  <p className="font-mono text-xl font-bold text-[#0052FF] tabular-nums">
                    {(
                      Number(salaryForm.baseSalary || 0) +
                      Number(salaryForm.allowances || 0) +
                      Number(salaryForm.overtimePay || 0) -
                      editingSalary.deductions
                    ).toLocaleString("en-BD")}{" "}
                    <span className="text-xs font-normal text-slate-500">BDT</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setIsSalaryModalOpen(false)}
                    className="min-h-11 h-11 px-5 text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="min-h-11 h-11 px-6 text-sm font-medium bg-[#0052FF] hover:bg-[#0047E0] text-white shadow-xs cursor-pointer"
                  >
                    Save Compensation
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: Record New Advance Modal                              */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isRecordAdvanceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#0052FF]">
                    <HandCoins className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#070B28]">
                      Record Staff Cash Advance
                    </h2>
                    <p className="text-xs text-slate-500">
                      Disburse salary advance with automated monthly recovery
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsRecordAdvanceModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveNewAdvance} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Employee Name *
                    </label>
                    <Input
                      required
                      value={newAdvanceForm.employeeName}
                      onChange={(e) =>
                        setNewAdvanceForm({ ...newAdvanceForm, employeeName: e.target.value })
                      }
                      placeholder="e.g. Tariqul Islam"
                      className="min-h-11 h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Employee Code / ID
                    </label>
                    <Input
                      value={newAdvanceForm.employeeCode}
                      onChange={(e) =>
                        setNewAdvanceForm({ ...newAdvanceForm, employeeCode: e.target.value })
                      }
                      placeholder="ST-EMP-102"
                      className="min-h-11 h-11 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                    Designation / Role
                  </label>
                  <select
                    value={newAdvanceForm.role}
                    onChange={(e) =>
                      setNewAdvanceForm({ ...newAdvanceForm, role: e.target.value })
                    }
                    className="w-full min-h-11 h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-[#070B28] shadow-xs focus:border-[#0052FF] focus:outline-hidden"
                  >
                    <option value="Cashier">Cashier</option>
                    <option value="Shift Lead">Shift Lead</option>
                    <option value="Store Manager">Store Manager</option>
                    <option value="Inventory Auditor">Inventory Auditor</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Advance Amount (BDT) *
                    </label>
                    <Input
                      required
                      type="number"
                      min="500"
                      step="500"
                      value={newAdvanceForm.advanceAmount}
                      onChange={(e) =>
                        setNewAdvanceForm({
                          ...newAdvanceForm,
                          advanceAmount: Number(e.target.value),
                        })
                      }
                      className="min-h-11 h-11 font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Monthly Deduction (BDT/mo) *
                    </label>
                    <Input
                      required
                      type="number"
                      min="100"
                      step="500"
                      value={newAdvanceForm.monthlyDeduction}
                      onChange={(e) =>
                        setNewAdvanceForm({
                          ...newAdvanceForm,
                          monthlyDeduction: Number(e.target.value),
                        })
                      }
                      className="min-h-11 h-11 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                    Reason / Purpose of Advance
                  </label>
                  <Input
                    value={newAdvanceForm.reason}
                    onChange={(e) =>
                      setNewAdvanceForm({ ...newAdvanceForm, reason: e.target.value })
                    }
                    placeholder="e.g. Medical emergency, urgent house repair, family loan"
                    className="min-h-11 h-11"
                  />
                </div>

                {/* Repayment Timeline Summary */}
                <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-3 flex items-center justify-between text-xs text-blue-900">
                  <span className="font-medium">Estimated Recovery Schedule:</span>
                  <span className="font-mono font-medium">
                    {Math.ceil(
                      (newAdvanceForm.advanceAmount || 0) /
                        (newAdvanceForm.monthlyDeduction || 1),
                    )}{" "}
                    Months to full clearance
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setIsRecordAdvanceModalOpen(false)}
                    className="min-h-11 h-11 px-5 text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="min-h-11 h-11 px-6 text-sm font-medium bg-[#0052FF] hover:bg-[#0047E0] text-white shadow-xs cursor-pointer"
                  >
                    Create Advance Record
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: Modify Advance Terms Modal                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isEditAdvanceModalOpen && editingAdvance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#0052FF]">
                    <Pencil className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#070B28]">
                      Modify Advance Terms
                    </h2>
                    <p className="text-xs text-slate-500">
                      {editingAdvance.employeeName} · {editingAdvance.employeeCode}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditAdvanceModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveEditAdvance} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Advance Principal (BDT) *
                    </label>
                    <Input
                      required
                      type="number"
                      min="0"
                      step="500"
                      value={editAdvanceForm.advanceAmount}
                      onChange={(e) =>
                        setEditAdvanceForm({
                          ...editAdvanceForm,
                          advanceAmount: Number(e.target.value),
                        })
                      }
                      className="min-h-11 h-11 font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Remaining Balance (BDT) *
                    </label>
                    <Input
                      required
                      type="number"
                      min="0"
                      step="500"
                      value={editAdvanceForm.remainingBalance}
                      onChange={(e) =>
                        setEditAdvanceForm({
                          ...editAdvanceForm,
                          remainingBalance: Number(e.target.value),
                        })
                      }
                      className="min-h-11 h-11 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Monthly Deduction (BDT/mo) *
                    </label>
                    <Input
                      required
                      type="number"
                      min="0"
                      step="500"
                      value={editAdvanceForm.monthlyDeduction}
                      onChange={(e) =>
                        setEditAdvanceForm({
                          ...editAdvanceForm,
                          monthlyDeduction: Number(e.target.value),
                        })
                      }
                      className="min-h-11 h-11 font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Status
                    </label>
                    <select
                      value={editAdvanceForm.status}
                      onChange={(e) =>
                        setEditAdvanceForm({
                          ...editAdvanceForm,
                          status: e.target.value as DemoAdvanceItem["status"],
                        })
                      }
                      className="w-full min-h-11 h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-[#070B28] shadow-xs focus:border-[#0052FF] focus:outline-hidden"
                    >
                      <option value="APPROVED">APPROVED</option>
                      <option value="PENDING">PENDING</option>
                      <option value="REPAID">REPAID</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                    Reason / Memo
                  </label>
                  <Input
                    value={editAdvanceForm.reason}
                    onChange={(e) =>
                      setEditAdvanceForm({ ...editAdvanceForm, reason: e.target.value })
                    }
                    className="min-h-11 h-11"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setIsEditAdvanceModalOpen(false)}
                    className="min-h-11 h-11 px-5 text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="min-h-11 h-11 px-6 text-sm font-medium bg-[#0052FF] hover:bg-[#0047E0] text-white shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: Void Advance Confirmation Modal                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isVoidModalOpen && advanceToVoid && (
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
                    Void Cash Advance Record?
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    Are you sure you want to void the advance ledger record for{" "}
                    <span className="font-medium text-[#070B28]">{advanceToVoid.employeeName}</span>?
                    This will forgive and clear the remaining outstanding balance of{" "}
                    <span className="font-mono font-medium text-rose-600">
                      {advanceToVoid.remainingBalance.toLocaleString("en-BD")} BDT
                    </span>.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsVoidModalOpen(false)}
                  className="min-h-10 h-10 px-4 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmVoidAdvance}
                  className="min-h-10 h-10 px-5 text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                >
                  Confirm & Void Record
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
