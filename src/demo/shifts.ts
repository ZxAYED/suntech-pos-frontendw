export interface DemoShift {
  id: string;
  shiftCode: string;
  cashierName: string;
  cashierRole: "Cashier" | "Shift Lead" | "Store Manager";
  terminalLane: string;
  openingFloat: number;
  expectedCash: number;
  countedCash: number;
  variance: number;
  status: "OPEN" | "BALANCED" | "CLOSED";
  openedAt: string;
  closedAt?: string;
  transactionsCount: number;
  salesTotal: number;
}

export const demoShifts: DemoShift[] = [
  {
    id: "sh-001",
    shiftCode: "SHIFT-2026-10-01",
    cashierName: "Alex Rivera",
    cashierRole: "Shift Lead",
    terminalLane: "Lane 01 (Front Register)",
    openingFloat: 10000,
    expectedCash: 34820,
    countedCash: 34820,
    variance: 0,
    status: "OPEN",
    openedAt: "Today, 08:30 AM",
    transactionsCount: 42,
    salesTotal: 48950,
  },
  {
    id: "sh-002",
    shiftCode: "SHIFT-2026-10-02",
    cashierName: "Tariqul Islam",
    cashierRole: "Cashier",
    terminalLane: "Lane 02 (Accessories)",
    openingFloat: 10000,
    expectedCash: 28450,
    countedCash: 28450,
    variance: 0,
    status: "BALANCED",
    openedAt: "Yesterday, 09:00 AM",
    closedAt: "Yesterday, 06:00 PM",
    transactionsCount: 38,
    salesTotal: 36200,
  },
  {
    id: "sh-003",
    shiftCode: "SHIFT-2026-10-03",
    cashierName: "Sumaiya Akhter",
    cashierRole: "Cashier",
    terminalLane: "Lane 01 (Front Register)",
    openingFloat: 10000,
    expectedCash: 41200,
    countedCash: 41200,
    variance: 0,
    status: "CLOSED",
    openedAt: "Oct 06, 08:45 AM",
    closedAt: "Oct 06, 05:45 PM",
    transactionsCount: 55,
    salesTotal: 58900,
  },
];
