"use client";

import { createApi } from "@/redux/api/createApi";

export const baseApi = createApi({
  reducerPath: "api",
  tagTypes: [
    "Auth",
    "Shift",
    "Category",
    "Product",
    "Variant",
    "Order",
    "Cashier",
    "Payroll",
    "Report",
  ],
});
