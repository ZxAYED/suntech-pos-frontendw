/**
 * Payroll and financial calculations according to SunTech POS business invariants.
 *
 * Formulas:
 * - Net Salary = Math.max(0, baseSalary - advances - deductions)
 * - Base salary must be > 0 (zero or missing base salary cannot be processed)
 * - If advances + deductions > baseSalary, net salary is 0 and the remaining balance is tracked as debt.
 */

export interface PayrollBreakdown {
  baseSalary: number;
  advances: number;
  deductions: number;
  netSalary: number;
  remainingDebt: number;
  hasDebt: boolean;
  isValid: boolean;
  error?: string;
}

/**
 * Computes net salary for an employee.
 * Throws an Error if baseSalary is 0, negative, or not a finite number.
 * Ensures net salary never goes negative.
 */
export function calculateNetSalary(
  baseSalary: number,
  advances = 0,
  deductions = 0,
): number {
  if (baseSalary === null || baseSalary === undefined || isNaN(baseSalary) || baseSalary <= 0) {
    throw new Error("Base salary must be greater than zero.");
  }

  const safeAdvances = Math.max(0, Number(advances) || 0);
  const safeDeductions = Math.max(0, Number(deductions) || 0);

  const rawNet = baseSalary - safeAdvances - safeDeductions;
  return Math.max(0, rawNet);
}

/**
 * Computes full payroll breakdown including remaining debt when deductions exceed base salary.
 */
export function calculatePayrollBreakdown(
  baseSalary: number,
  advances = 0,
  deductions = 0,
): PayrollBreakdown {
  if (baseSalary === null || baseSalary === undefined || isNaN(baseSalary) || baseSalary <= 0) {
    return {
      baseSalary: 0,
      advances: Math.max(0, Number(advances) || 0),
      deductions: Math.max(0, Number(deductions) || 0),
      netSalary: 0,
      remainingDebt: 0,
      hasDebt: false,
      isValid: false,
      error: "Base salary must be greater than zero.",
    };
  }

  const safeAdvances = Math.max(0, Number(advances) || 0);
  const safeDeductions = Math.max(0, Number(deductions) || 0);
  const totalDeductions = safeAdvances + safeDeductions;
  const rawNet = baseSalary - totalDeductions;

  const netSalary = Math.max(0, rawNet);
  const remainingDebt = rawNet < 0 ? Math.abs(rawNet) : 0;

  return {
    baseSalary,
    advances: safeAdvances,
    deductions: safeDeductions,
    netSalary,
    remainingDebt,
    hasDebt: remainingDebt > 0,
    isValid: true,
  };
}
