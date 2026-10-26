import type { Business } from "@/types/domain";

export const mockBusinesses: Business[] = [
  {
    id: "biz-suntech-elec",
    name: "SunTech Electronics Ltd",
    code: "ST-ELEC",
    status: "ACTIVE",
    locations: [
      { id: "loc-doyel", businessId: "biz-suntech-elec", name: "Uttara Doyel Branch", code: "DOYEL-01", address: "House 12, Road 4, Sector 3, Uttara, Dhaka", status: "ACTIVE" },
      { id: "loc-bashundhara", businessId: "biz-suntech-elec", name: "Bashundhara City Branch", code: "BSH-02", address: "Level 5, Block B, Bashundhara City Mall, Dhaka", status: "ACTIVE" },
      { id: "loc-jamuna", businessId: "biz-suntech-elec", name: "Jamuna Future Park Branch", code: "JFP-03", address: "Level 4, Zone C, Jamuna Future Park, Dhaka", status: "ACTIVE" },
    ],
  },
  {
    id: "biz-gadget-hub",
    name: "SunTech Gadget Hub",
    code: "ST-HUB",
    status: "ACTIVE",
    locations: [
      { id: "loc-dhanmondi", businessId: "biz-gadget-hub", name: "Dhanmondi 27 Hub", code: "DHM-01", address: "Rangs Fortune Square, Dhanmondi 27, Dhaka", status: "ACTIVE" },
      { id: "loc-gulshan", businessId: "biz-gadget-hub", name: "Gulshan 1 Flagship", code: "GUL-02", address: "Navana Tower, Gulshan 1, Dhaka", status: "ACTIVE" },
    ],
  },
  {
    id: "biz-apex",
    name: "Apex Retail Partners",
    code: "APX-RETAIL",
    status: "ACTIVE",
    locations: [],
  },
];
