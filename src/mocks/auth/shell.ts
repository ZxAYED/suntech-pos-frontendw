import type { NavbarViewModel } from "@/components/layout/navbar";

export const mockAdminNavbar: NavbarViewModel = {
  userName: "Store Administrator",
  initials: "SA",
  shift: { status: "UNKNOWN" },
};

export const mockCashierNavbar: NavbarViewModel = {
  userName: "Alex Rivera",
  initials: "AR",
  locationName: "Uttara Doyel Branch",
  shift: { status: "OPEN", openingFloat: 10000 },
};
