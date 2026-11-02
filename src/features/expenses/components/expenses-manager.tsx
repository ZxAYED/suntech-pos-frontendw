"use client";

import { useMemo, useRef, useState } from "react";
import { Plus, Receipt, Trash2, Pencil, Building, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { DataState, MetricGridSkeleton, TenantRequiredState } from "@/components/common/data-state";
import { MetricCard } from "@/components/common/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useExpenses,
  useExpenseSummary,
  type ExpenseCategory,
  type ExpenseSourceType,
  type ExpenseRecord,
} from "@/features/expenses/api/use-expenses";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import { createExpenseSchema, updateExpenseSchema } from "@/lib/validations";
import { formatBDT } from "@/lib/utils";

const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: "RENT", label: "Rent & Facilities" },
  { id: "UTILITIES", label: "Electricity & Utilities" },
  { id: "SALARIES", label: "Salaries & Wages" },
  { id: "SUPPLIES", label: "Office & Store Supplies" },
  { id: "MAINTENANCE", label: "Repairs & Maintenance" },
  { id: "MARKETING", label: "Marketing & Promotion" },
  { id: "TRANSPORT", label: "Delivery & Transport" },
  { id: "INVENTORY", label: "Direct Inventory / Freight" },
  { id: "PERSONAL_DRAWING", label: "Owner Drawing" },
  { id: "OTHER", label: "Other Operating Cost" },
];

export function ExpensesManager() {
  const tenant = useTenantScope("admin");
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const filters = useMemo(
    () => ({
      month: currentMonth,
      year: currentYear,
      category: selectedCategory !== "ALL" ? (selectedCategory as ExpenseCategory) : undefined,
      type: selectedType !== "ALL" ? (selectedType as ExpenseSourceType) : undefined,
      search: searchTerm || undefined,
    }),
    [currentMonth, currentYear, selectedCategory, selectedType, searchTerm],
  );

  const expenses = useExpenses(filters);
  const summary = useExpenseSummary({
    month: currentMonth,
    year: currentYear,
    type: selectedType !== "ALL" ? (selectedType as ExpenseSourceType) : undefined,
  });
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRecord | null>(null);
  const [editTarget, setEditTarget] = useState<ExpenseRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  // Create Form state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("OTHER");
  const [note, setNote] = useState("");

  // Edit Form state
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState<ExpenseCategory>("OTHER");
  const [editNote, setEditNote] = useState("");

  if (!tenant.isTenantReady) return <TenantRequiredState />;

  const expenseItems = expenses.data?.items ?? [];
  const totalAmount = expenses.data?.totalAmount ?? summary.data?.summary?.totalExpenses ?? 0;
  const expenseCount = expenses.data?.totalCount ?? summary.data?.summary?.expenseCount ?? expenseItems.length;

  const topCategoryEntry = (summary.data?.summary?.byCategory ?? []).slice().sort((a, b) => b.total - a.total)[0];
  const topCategoryLabel = topCategoryEntry
    ? `${topCategoryEntry.category} (${formatBDT(topCategoryEntry.total)})`
    : "None";

  const handleCreate = async () => {
    if (isSubmittingRef.current || createExpense.isPending) return;

    const numericAmount = Number(amount);
    const parsed = createExpenseSchema.safeParse({
      title: title.trim(),
      amount: numericAmount,
      category,
      note: note.trim() || undefined,
      locationId: tenant.locationId || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Invalid expense details");
      return;
    }

    try {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      await createExpense.mutateAsync({
        title: parsed.data.title,
        amount: parsed.data.amount,
        category: parsed.data.category,
        note: parsed.data.note,
        locationId: parsed.data.locationId ?? undefined,
      });
      toast.success("Expense recorded successfully");
      setIsCreateOpen(false);
      setTitle("");
      setAmount("");
      setCategory("OTHER");
      setNote("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to record expense");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const openEditModal = (expense: ExpenseRecord) => {
    setEditTarget(expense);
    setEditTitle(expense.title);
    setEditAmount(String(expense.amount));
    setEditCategory(expense.category);
    setEditNote(expense.note || "");
  };

  const handleUpdate = async () => {
    if (isSubmittingRef.current || updateExpense.isPending || !editTarget) return;

    const numericAmount = Number(editAmount);
    const parsed = updateExpenseSchema.safeParse({
      id: editTarget.id,
      title: editTitle.trim(),
      amount: numericAmount,
      category: editCategory,
      note: editNote.trim() || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Invalid update details");
      return;
    }

    try {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      await updateExpense.mutateAsync({
        id: editTarget.id,
        title: parsed.data.title,
        amount: parsed.data.amount,
        category: parsed.data.category,
        note: parsed.data.note,
        businessId: editTarget.businessId,
      });
      toast.success("Expense updated successfully");
      setEditTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update expense");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isSubmittingRef.current || deleteExpense.isPending || !deleteTarget) return;

    try {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      await deleteExpense.mutateAsync({ id: deleteTarget.id });
      toast.success("Expense cancelled successfully");
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel expense");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operational Expenses"
        description="Record and review business operating costs by category and reporting period."
        actions={
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#0052FF] text-white hover:bg-[#0047E0]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Record Expense
          </Button>
        }
      />

      {summary.isLoading ? (
        <MetricGridSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Total expenses this month"
            value={formatBDT(totalAmount)}
            icon={DollarSign}
          />
          <MetricCard
            label="Expense entries"
            value={expenseCount}
            icon={Receipt}
          />
          <MetricCard
            label="Top spending category"
            value={topCategoryLabel}
            icon={Building}
          />
        </div>
      )}

      {/* Filter Toolbar */}
      <Card className="border-slate-200 p-4 shadow-xs">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Expense Type</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="MANUAL">Manual Expenses</SelectItem>
                <SelectItem value="PAYROLL_NET">Payroll Disbursements</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Keyword Search</label>
            <Input
              className="mt-1"
              placeholder="Search title or note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Period (Month / Year)</label>
            <div className="mt-1 flex gap-2">
              <Select
                value={String(currentMonth)}
                onValueChange={(val) => setCurrentMonth(Number(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {new Date(2026, m - 1, 1).toLocaleString("en-US", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(currentYear)}
                onValueChange={(val) => setCurrentYear(Number(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2025, 2026, 2027].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Expenses Table */}
      <DataState
        data={expenseItems}
        isLoading={expenses.isLoading}
        isError={expenses.isError}
        resource="expenses"
        emptyTitle="No operational expenses recorded for this period."
        onRetry={() => void expenses.refetch()}
      >
        {(rows) => (
          <Card className="overflow-hidden border-slate-200 shadow-xs">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Title & Note</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Incurred Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const isPayroll = row.sourceType === "PAYROLL_NET" || row.type === "PAYROLL_NET";
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <p className="font-medium text-[#070B28]">{row.title}</p>
                          {row.note && <p className="text-xs text-slate-400">{row.note}</p>}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              isPayroll
                                ? "border-indigo-200 bg-indigo-50 text-indigo-700 font-medium"
                                : "border-slate-200 bg-slate-50 text-slate-700"
                            }
                          >
                            {isPayroll ? "Payroll" : "Manual"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                            {row.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {new Date(row.spentAt).toLocaleDateString("en-BD", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {row.location?.name || tenant.activeBranch?.name || "General"}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-[#070B28]">
                          {formatBDT(row.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {isPayroll ? (
                            <span className="text-xs text-slate-400 font-medium">System Managed</span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(row)}
                                className="h-8 px-2.5 text-xs text-slate-700 hover:text-slate-900"
                                title="Edit Expense"
                              >
                                <Pencil className="mr-1 h-3.5 w-3.5" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteTarget(row)}
                                className="h-8 px-2.5 text-xs border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                title="Cancel this expense"
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Cancel
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </DataState>

      {/* Record Expense Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Operational Expense</DialogTitle>
            <DialogDescription>
              Add an operational or business expense under {tenant.activeBusiness?.name} (
              {tenant.activeBranch?.name}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="expense-title" className="text-xs font-medium">
                Title *
              </label>
              <Input
                id="expense-title"
                placeholder="e.g. Monthly Premise Rent"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="expense-amount" className="text-xs font-medium">
                Amount (BDT) *
              </label>
              <Input
                id="expense-amount"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium">Category</label>
              <Select
                value={category}
                onValueChange={(val) => setCategory(val as ExpenseCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="expense-note" className="text-xs font-medium">
                Note / Description (Optional)
              </label>
              <Input
                id="expense-note"
                placeholder="e.g. Paid via bank transfer for Uttara branch"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <Button
              className="w-full bg-[#0052FF] text-white hover:bg-[#0047E0]"
              onClick={handleCreate}
              disabled={isSubmitting || createExpense.isPending}
              loading={isSubmitting || createExpense.isPending}
            >
              Save Expense Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Operational Expense</DialogTitle>
            <DialogDescription>
              Update operational expense details. Only manual expenses can be edited.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="edit-expense-title" className="text-xs font-medium">
                Title *
              </label>
              <Input
                id="edit-expense-title"
                placeholder="e.g. Monthly Premise Rent"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="edit-expense-amount" className="text-xs font-medium">
                Amount (BDT) *
              </label>
              <Input
                id="edit-expense-amount"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 15000"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium">Category</label>
              <Select
                value={editCategory}
                onValueChange={(val) => setEditCategory(val as ExpenseCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="edit-expense-note" className="text-xs font-medium">
                Note / Description (Optional)
              </label>
              <Input
                id="edit-expense-note"
                placeholder="e.g. Paid via bank transfer"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
            </div>

            <Button
              className="w-full bg-[#0052FF] text-white hover:bg-[#0047E0]"
              onClick={handleUpdate}
              disabled={isSubmitting || updateExpense.isPending}
              loading={isSubmitting || updateExpense.isPending}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Expense Confirmation Dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Expense Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel and remove this expense entry?
            </DialogDescription>
          </DialogHeader>

          {deleteTarget ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Expense Title:</span>
                <span className="font-medium text-[#070B28]">{deleteTarget.title}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Category:</span>
                <span className="font-medium text-[#070B28]">{deleteTarget.category}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-700 font-semibold">
                <span>Amount:</span>
                <span className="font-mono text-rose-600">{formatBDT(deleteTarget.amount)}</span>
              </div>
              {deleteTarget.note ? (
                <div className="flex justify-between text-xs text-slate-500 pt-0.5">
                  <span>Note:</span>
                  <span>{deleteTarget.note}</span>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isSubmitting || deleteExpense.isPending}
            >
              No, Keep Expense
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting || deleteExpense.isPending}
              loading={isSubmitting || deleteExpense.isPending}
            >
              Yes, Cancel Expense
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
