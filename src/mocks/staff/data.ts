import type { Cashier } from "@/types/domain";

export const mockCashiers: Cashier[] = [
  { id: "cashier-101", fullName: "Alex Rivera", publicId: "ST-EMP-101", email: "alex.rivera@suntechpos.bd", phoneNumber: "+880 1711-902341", locationId: "loc-doyel", locationName: "Uttara Doyel Branch", monthlySalary: 35000, status: "ACTIVE", createdAt: "2024-01-15T00:00:00Z" },
  { id: "cashier-102", fullName: "Tariqul Islam", publicId: "ST-EMP-102", email: "tariqul.i@suntechpos.bd", phoneNumber: "+880 1812-445566", locationId: "loc-doyel", locationName: "Uttara Doyel Branch", monthlySalary: 24000, status: "ACTIVE", createdAt: "2024-03-10T00:00:00Z" },
  { id: "cashier-103", fullName: "Sumaiya Akhter", publicId: "ST-EMP-103", email: "sumaiya.a@suntechpos.bd", phoneNumber: "+880 1913-778899", locationId: "loc-doyel", locationName: "Uttara Doyel Branch", monthlySalary: 28000, status: "ACTIVE", createdAt: "2024-02-01T00:00:00Z" },
  { id: "cashier-104", fullName: "Zubair Rahman", publicId: "ST-EMP-104", email: "zubair.r@suntechpos.bd", phoneNumber: "+880 1614-223344", locationId: "loc-bashundhara", locationName: "Bashundhara City Branch", monthlySalary: 55000, status: "SUSPENDED", createdAt: "2023-11-20T00:00:00Z" },
];
