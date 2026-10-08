"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
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
import { demoStaff, type DemoStaff } from "@/demo/staff";

export function StaffManager() {
  const [staffList, setStaffList] = useState<DemoStaff[]>(demoStaff);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<DemoStaff | null>(null);

  // Form State
  const [staffForm, setStaffForm] = useState({
    name: "",
    employeeCode: "",
    role: "Cashier" as DemoStaff["role"],
    email: "",
    phone: "",
    store: "Jamuna Future Park",
    shiftStatus: "ON_DUTY" as DemoStaff["shiftStatus"],
    attendanceRate: "98.5%",
  });

  const filteredStaff = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredStaff.length / pageSize) || 1;
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleOpenAddModal = () => {
    setEditingStaffId(null);
    setStaffForm({
      name: "",
      employeeCode: `ST-EMP-${Math.floor(100 + Math.random() * 900)}`,
      role: "Cashier",
      email: "",
      phone: "+880 1",
      store: "Jamuna Future Park",
      shiftStatus: "ON_DUTY",
      attendanceRate: "100%",
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (st: DemoStaff) => {
    setEditingStaffId(st.id);
    setStaffForm({
      name: st.name,
      employeeCode: st.employeeCode,
      role: st.role,
      email: st.email,
      phone: st.phone,
      store: st.store,
      shiftStatus: st.shiftStatus,
      attendanceRate: st.attendanceRate,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (st: DemoStaff) => {
    setStaffToDelete(st);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!staffToDelete) return;
    setStaffList((prev) => prev.filter((s) => s.id !== staffToDelete.id));
    toast.success(`Removed ${staffToDelete.name} from staff directory.`);
    setIsDeleteModalOpen(false);
    setStaffToDelete(null);
  };

  const handleSaveStaff = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!staffForm.name.trim() || !staffForm.employeeCode.trim()) {
      toast.error("Employee Name and Staff Code are required.");
      return;
    }

    if (editingStaffId) {
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === editingStaffId
            ? {
                ...s,
                name: staffForm.name.trim(),
                employeeCode: staffForm.employeeCode.trim(),
                role: staffForm.role,
                email: staffForm.email.trim() || `${staffForm.name.toLowerCase().replace(/\s+/g, ".")}@suntechpos.bd`,
                phone: staffForm.phone.trim(),
                store: staffForm.store,
                shiftStatus: staffForm.shiftStatus,
              }
            : s,
        ),
      );
      toast.success(`Updated staff profile for "${staffForm.name}".`);
    } else {
      const newStaff: DemoStaff = {
        id: `st-${Date.now()}`,
        name: staffForm.name.trim(),
        employeeCode: staffForm.employeeCode.trim(),
        role: staffForm.role,
        email: staffForm.email.trim() || `${staffForm.name.toLowerCase().replace(/\s+/g, ".")}@suntechpos.bd`,
        phone: staffForm.phone.trim() || "+880 1700-000000",
        store: staffForm.store,
        shiftStatus: staffForm.shiftStatus,
        attendanceRate: staffForm.attendanceRate,
        joinDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };
      setStaffList([newStaff, ...staffList]);
      toast.success(`Enrolled new employee "${newStaff.name}" (${newStaff.employeeCode}).`);
    }

    setIsFormModalOpen(false);
  };

  const handleToggleStatus = (st: DemoStaff) => {
    const nextStatus: DemoStaff["shiftStatus"] = st.shiftStatus === "ON_DUTY" ? "OFF_DUTY" : "ON_DUTY";
    setStaffList((prev) =>
      prev.map((s) => (s.id === st.id ? { ...s, shiftStatus: nextStatus } : s)),
    );
    toast.success(`Updated ${st.name} status to ${nextStatus.replace("_", " ")}.`);
  };

  return (
    <div className="space-y-6 font-sans select-none">
      {/* ═══ Row 1: The Main Header (Title + Actions ONLY) ═══ */}
      <PageHeader
        title="Staff Directory & Attendance"
        actions={
          <Button
            size="lg"
            onClick={handleOpenAddModal}
            className="min-h-12 h-12 px-8 bg-[#0052FF] hover:bg-[#0047E0] text-white text-base font-medium cursor-pointer shadow-xs gap-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add New Staff</span>
          </Button>
        }
      />

      {/* ═══ Row 2: The Toolbar / Sub-navigation (mb-6) ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search staff name, employee ID, or role..."
            className="min-h-11 h-11 pl-10 pr-4 text-sm font-medium border-slate-200 bg-white text-[#070B28] placeholder:text-slate-400 shadow-xs focus-visible:border-[#0052FF] focus-visible:ring-2 focus-visible:ring-[#0052FF]/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-slate-200 font-mono text-xs font-medium tabular-nums text-slate-600 px-3 py-1 bg-white"
          >
            {filteredStaff.length} Employees Active
          </Badge>
        </div>
      </div>

      {/* High-Density Staff Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full text-sm">
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-3.5 px-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  Employee
                </TableHead>
                <TableHead className="py-3.5 px-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  Employee ID
                </TableHead>
                <TableHead className="py-3.5 px-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  Designation
                </TableHead>
                <TableHead className="py-3.5 px-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  Store Location
                </TableHead>
                <TableHead className="py-3.5 px-4 text-center text-xs font-medium uppercase tracking-wider text-slate-400">
                  Attendance
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
              {paginatedStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-slate-400 text-sm">
                    No employees found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStaff.map((st) => (
                  <TableRow key={st.id} className="h-16 hover:bg-slate-50/70 transition-colors">
                    {/* Employee Name & Contact beneath */}
                    <TableCell className="py-3.5 px-4 text-left">
                      <p className="font-medium text-sm text-[#070B28] leading-tight">
                        {st.name}
                      </p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {st.email} · {st.phone}
                      </p>
                    </TableCell>

                    {/* Employee ID */}
                    <TableCell className="py-3.5 px-4 text-left font-mono text-sm font-medium text-[#070B28] tabular-nums">
                      <span className="font-mono tabular-nums text-[#070B28]">
                        {st.employeeCode}
                      </span>
                    </TableCell>

                    {/* Designation */}
                    <TableCell className="py-3.5 px-4 text-left text-slate-700 font-medium text-xs sm:text-sm">
                      {st.role}
                    </TableCell>

                    {/* Store Location */}
                    <TableCell className="py-3.5 px-4 text-left text-slate-600 text-xs sm:text-sm">
                      {st.store}
                    </TableCell>

                    {/* Attendance Rate */}
                    <TableCell className="py-3.5 px-4 text-center font-mono font-medium text-emerald-600 text-xs sm:text-sm tabular-nums">
                      <span className="font-mono tabular-nums text-emerald-600">
                        {st.attendanceRate}
                      </span>
                    </TableCell>

                    {/* Shift Status */}
                    <TableCell className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded border ${
                          st.shiftStatus === "ON_DUTY"
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200/60"
                            : st.shiftStatus === "ON_BREAK"
                              ? "text-amber-700 bg-amber-50 border-amber-200/60"
                              : "text-slate-600 bg-slate-100 border-slate-200"
                        }`}
                      >
                        {st.shiftStatus.replace("_", " ")}
                      </span>
                    </TableCell>

                    {/* Action Column: Direct Edit/Delete Buttons + Dropdown */}
                    <TableCell className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Direct Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(st)}
                          className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg text-slate-500 hover:text-[#0052FF] hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-colors cursor-pointer"
                          title="Edit Staff Member"
                          aria-label={`Edit ${st.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        {/* Direct Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(st)}
                          className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                          title="Deactivate / Delete Staff"
                          aria-label={`Deactivate ${st.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        {/* More Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg text-slate-400 hover:text-[#070B28] hover:bg-slate-100 cursor-pointer transition-colors"
                              title="More options"
                              aria-label="More staff actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-white border-slate-200 shadow-xl rounded-lg p-1.5 z-50">
                            <DropdownMenuItem
                              onClick={() => handleOpenEditModal(st)}
                              className="flex items-center gap-2.5 py-2 px-3 text-xs font-medium text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                            >
                              <Pencil className="h-4 w-4 text-slate-500" />
                              <span>Edit Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toast.info(`Viewing timesheet & activity for ${st.name}`)}
                              className="flex items-center gap-2.5 py-2 px-3 text-xs font-medium text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                            >
                              <Eye className="h-4 w-4 text-slate-500" />
                              <span>Activity Logs</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(st)}
                              className="flex items-center gap-2.5 py-2 px-3 text-xs font-medium text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                            >
                              <CheckCircle2 className="h-4 w-4 text-[#0052FF]" />
                              <span>Toggle Duty Status</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 bg-slate-100" />
                            <DropdownMenuItem
                              onClick={() => handleOpenDeleteModal(st)}
                              className="flex items-center gap-2.5 py-2 px-3 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer rounded-md transition-colors"
                            >
                              <Trash2 className="h-4 w-4 text-rose-500" />
                              <span>Deactivate Staff</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ═══ Reusable DataPagination ═══ */}
        <div className="border-t border-slate-200 bg-white px-4 py-1">
          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredStaff.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[4, 8, 15, 25]}
            itemLabel="employees"
          />
        </div>
      </div>

      {/* ═══ Modal: Add or Edit Staff Member ═══ */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormModalOpen(false)}
              className="fixed inset-0 bg-[#070B28]/60 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative z-10 w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-[#0052FF]">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-[#070B28]">
                      {editingStaffId ? "Edit Staff Member" : "Enroll New Employee"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {editingStaffId
                        ? "Update staff designation, shift status, and branch assignments."
                        : "Register new staff credentials for POS lane authentication."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStaff} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Full Name *
                    </label>
                    <Input
                      required
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                      placeholder="e.g. Tariqul Islam"
                      className="min-h-11 h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Staff ID / Code *
                    </label>
                    <Input
                      required
                      value={staffForm.employeeCode}
                      onChange={(e) => setStaffForm({ ...staffForm, employeeCode: e.target.value })}
                      placeholder="ST-EMP-102"
                      className="min-h-11 h-11 font-mono uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Role / Designation
                    </label>
                    <select
                      value={staffForm.role}
                      onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as DemoStaff["role"] })}
                      className="w-full min-h-11 h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-[#070B28] shadow-xs focus:border-[#0052FF] focus:outline-hidden"
                    >
                      <option value="Cashier">Cashier</option>
                      <option value="Shift Lead">Shift Lead</option>
                      <option value="Inventory Auditor">Inventory Auditor</option>
                      <option value="Store Manager">Store Manager</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Shift Status
                    </label>
                    <select
                      value={staffForm.shiftStatus}
                      onChange={(e) => setStaffForm({ ...staffForm, shiftStatus: e.target.value as DemoStaff["shiftStatus"] })}
                      className="w-full min-h-11 h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-[#070B28] shadow-xs focus:border-[#0052FF] focus:outline-hidden"
                    >
                      <option value="ON_DUTY">ON DUTY</option>
                      <option value="ON_BREAK">ON BREAK</option>
                      <option value="OFF_DUTY">OFF DUTY</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Contact Phone
                    </label>
                    <Input
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                      placeholder="+880 1812-445566"
                      className="min-h-11 h-11 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      placeholder="tariqul.i@suntechpos.bd"
                      className="min-h-11 h-11"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Store Location / Branch
                    </label>
                    <Input
                      value={staffForm.store}
                      onChange={(e) => setStaffForm({ ...staffForm, store: e.target.value })}
                      placeholder="Jamuna Future Park (Lane 01)"
                      className="min-h-11 h-11"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setIsFormModalOpen(false)}
                    className="min-h-12 h-12 px-6 text-base font-medium border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="min-h-12 h-12 px-8 text-base font-medium bg-[#0052FF] hover:bg-[#0047E0] text-white shadow-xs cursor-pointer"
                  >
                    {editingStaffId ? "Update Profile" : "Enroll Staff"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ Modal: Deactivate / Delete Staff Confirmation ═══ */}
      <AnimatePresence>
        {isDeleteModalOpen && staffToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="fixed inset-0 bg-[#070B28]/60 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#070B28]">
                    Deactivate Staff Member?
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Are you sure you want to deactivate{" "}
                    <span className="font-medium text-[#070B28]">
                      {staffToDelete.name}
                    </span>{" "}
                    ({staffToDelete.employeeCode})? Their access to POS register lanes will be revoked immediately.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="min-h-11 h-11 px-5 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer text-sm font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="min-h-11 h-11 px-6 bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-xs cursor-pointer text-sm"
                >
                  Confirm Deactivate
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
