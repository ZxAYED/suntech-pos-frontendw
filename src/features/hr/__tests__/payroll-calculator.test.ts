import { describe, expect, it } from "vitest";
import {
  calculateNetSalary,
  calculatePayrollBreakdown,
} from "@/features/hr/utils/payroll-calculator";

describe("Payroll Calculations (Guide Reference Lines 138-147 & 310)", () => {
  it("computes net salary using standard formula: baseSalary - advances - deductions", () => {
    // Exact test case from Integration Guide line 145: calculateNetSalary(1000, 200, 100) === 700
    expect(calculateNetSalary(1000, 200, 100)).toBe(700);
  });

  it("handles standard employee salary calculation: base 10000, advances 3000, deductions 500", () => {
    // Example from Integration Guide line 227: 10000 - 3000 - 500 = 6500 BDT
    expect(calculateNetSalary(10000, 3000, 500)).toBe(6500);
  });

  it("handles zero advances and zero deductions", () => {
    expect(calculateNetSalary(25000, 0, 0)).toBe(25000);
    expect(calculateNetSalary(25000)).toBe(25000);
  });

  it("ensures net salary is non-negative when advances exceed salary", () => {
    // If cashier advanced more than salary, net pay should not be negative (capped at 0)
    expect(calculateNetSalary(5000, 6000, 0)).toBe(0);
    expect(calculateNetSalary(5000, 3000, 4000)).toBe(0);
  });

  it("tracks excess advances as debt in payroll breakdown", () => {
    const breakdown = calculatePayrollBreakdown(5000, 6000, 500);
    expect(breakdown.netSalary).toBe(0);
    expect(breakdown.remainingDebt).toBe(1500);
    expect(breakdown.hasDebt).toBe(true);
    expect(breakdown.isValid).toBe(true);
  });

  it("throws an error if base salary is 0 or negative", () => {
    // Guide edge cases: "Also test edge (if base=0, error)"
    expect(() => calculateNetSalary(0, 0, 0)).toThrow(/Base salary must be greater than zero/);
    expect(() => calculateNetSalary(-500, 0, 0)).toThrow(/Base salary must be greater than zero/);
    expect(() => calculateNetSalary(NaN, 100, 50)).toThrow(/Base salary must be greater than zero/);
  });

  it("returns invalid state in breakdown when base salary is missing or zero", () => {
    const zeroBreakdown = calculatePayrollBreakdown(0, 100, 50);
    expect(zeroBreakdown.isValid).toBe(false);
    expect(zeroBreakdown.error).toMatch(/Base salary must be greater than zero/);
  });
});
