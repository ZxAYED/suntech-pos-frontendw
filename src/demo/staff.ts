export interface DemoStaff {
  id: string;
  name: string;
  employeeCode: string;
  role: "Shift Lead" | "Cashier" | "Inventory Auditor" | "Store Manager";
  email: string;
  phone: string;
  store: string;
  shiftStatus: "ON_DUTY" | "ON_BREAK" | "OFF_DUTY";
  attendanceRate: string;
  joinDate: string;
}

export const demoStaff: DemoStaff[] = [
  {
    id: "st-01",
    name: "Alex Rivera",
    employeeCode: "ST-EMP-101",
    role: "Shift Lead",
    email: "alex.rivera@suntechpos.bd",
    phone: "+880 1711-902341",
    store: "Jamuna Future Park",
    shiftStatus: "ON_DUTY",
    attendanceRate: "98.5%",
    joinDate: "Jan 15, 2024",
  },
  {
    id: "st-02",
    name: "Tariqul Islam",
    employeeCode: "ST-EMP-102",
    role: "Cashier",
    email: "tariqul.i@suntechpos.bd",
    phone: "+880 1812-445566",
    store: "Jamuna Future Park",
    shiftStatus: "ON_DUTY",
    attendanceRate: "96.0%",
    joinDate: "Mar 10, 2024",
  },
  {
    id: "st-03",
    name: "Sumaiya Akhter",
    employeeCode: "ST-EMP-103",
    role: "Inventory Auditor",
    email: "sumaiya.a@suntechpos.bd",
    phone: "+880 1913-778899",
    store: "Bashundhara City",
    shiftStatus: "ON_DUTY",
    attendanceRate: "99.0%",
    joinDate: "Feb 01, 2024",
  },
  {
    id: "st-04",
    name: "Zubair Rahman",
    employeeCode: "ST-EMP-104",
    role: "Store Manager",
    email: "zubair.r@suntechpos.bd",
    phone: "+880 1614-223344",
    store: "Jamuna Future Park",
    shiftStatus: "ON_DUTY",
    attendanceRate: "100%",
    joinDate: "Nov 20, 2023",
  },
];
