export interface DemoPayrollItem {
  id: string;
  employeeName: string;
  employeeCode: string;
  role: string;
  month: string;
  baseSalary: number;
  allowances: number;
  overtimeHours: number;
  overtimePay: number;
  deductions: number;
  netSalary: number;
  paymentStatus: "PAID" | "PENDING" | "PROCESSING";
  disbursedAt?: string;
}

export const demoPayroll: DemoPayrollItem[] = [
  {
    id: "pay-01",
    employeeName: "Alex Rivera",
    employeeCode: "ST-EMP-101",
    role: "Shift Lead",
    month: "September 2026",
    baseSalary: 35000,
    allowances: 5000,
    overtimeHours: 12,
    overtimePay: 2700,
    deductions: 0,
    netSalary: 42700,
    paymentStatus: "PAID",
    disbursedAt: "Oct 01, 2026",
  },
  {
    id: "pay-02",
    employeeName: "Tariqul Islam",
    employeeCode: "ST-EMP-102",
    role: "Cashier",
    month: "September 2026",
    baseSalary: 24000,
    allowances: 3500,
    overtimeHours: 8,
    overtimePay: 1400,
    deductions: 500,
    netSalary: 28400,
    paymentStatus: "PAID",
    disbursedAt: "Oct 01, 2026",
  },
  {
    id: "pay-03",
    employeeName: "Sumaiya Akhter",
    employeeCode: "ST-EMP-103",
    role: "Inventory Auditor",
    month: "September 2026",
    baseSalary: 28000,
    allowances: 4000,
    overtimeHours: 6,
    overtimePay: 1200,
    deductions: 0,
    netSalary: 33200,
    paymentStatus: "PAID",
    disbursedAt: "Oct 01, 2026",
  },
  {
    id: "pay-04",
    employeeName: "Zubair Rahman",
    employeeCode: "ST-EMP-104",
    role: "Store Manager",
    month: "September 2026",
    baseSalary: 55000,
    allowances: 8000,
    overtimeHours: 0,
    overtimePay: 0,
    deductions: 0,
    netSalary: 63000,
    paymentStatus: "PAID",
    disbursedAt: "Oct 01, 2026",
  },
];

export interface DemoAdvanceItem {
  id: string;
  employeeName: string;
  employeeCode: string;
  role: string;
  requestDate: string;
  advanceAmount: number;
  monthlyDeduction: number;
  remainingBalance: number;
  reason: string;
  status: "APPROVED" | "PENDING" | "REPAID";
}

export const demoAdvances: DemoAdvanceItem[] = [
  {
    id: "adv-01",
    employeeName: "Tariqul Islam",
    employeeCode: "ST-EMP-102",
    role: "Cashier",
    requestDate: "Sep 15, 2026",
    advanceAmount: 10000,
    monthlyDeduction: 2500,
    remainingBalance: 5000,
    reason: "Emergency Family Medical",
    status: "APPROVED",
  },
  {
    id: "adv-02",
    employeeName: "Sumaiya Akhter",
    employeeCode: "ST-EMP-103",
    role: "Inventory Auditor",
    requestDate: "Sep 22, 2026",
    advanceAmount: 8000,
    monthlyDeduction: 2000,
    remainingBalance: 8000,
    reason: "House Relocation Rent Deposit",
    status: "APPROVED",
  },
  {
    id: "adv-03",
    employeeName: "Alex Rivera",
    employeeCode: "ST-EMP-101",
    role: "Shift Lead",
    requestDate: "Oct 02, 2026",
    advanceAmount: 15000,
    monthlyDeduction: 3000,
    remainingBalance: 15000,
    reason: "Motorcycle Maintenance",
    status: "PENDING",
  },
];
