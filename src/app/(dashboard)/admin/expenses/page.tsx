import { ExpensesManager } from "@/features/expenses/components/expenses-manager";

export const metadata = {
  title: "Operational Expenses | SunTech POS",
  description: "Manage business and operational expenses across branch locations.",
};

export default function AdminExpensesPage() {
  return <ExpensesManager />;
}
