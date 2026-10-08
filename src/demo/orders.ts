export interface DemoOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  paymentMethod: "Cash (COD)" | "bKash Merchant" | "Nagad" | "Visa/Mastercard";
  itemsSummary: string;
  itemsCount: number;
  subtotal: number;
  vat: number;
  total: number;
  status: "SETTLED" | "REFUNDED" | "HELD";
  timestamp: string;
  terminal: string;
}

export const demoOrders: DemoOrder[] = [
  {
    id: "ord-101",
    orderNumber: "INV-2026-901",
    customerName: "Rafiul Karim",
    customerPhone: "+880 1711-234567",
    paymentMethod: "Cash (COD)",
    itemsSummary: "Infinix 45W Fast Charger Kit (x1)",
    itemsCount: 1,
    subtotal: 1450,
    vat: 73,
    total: 1523,
    status: "SETTLED",
    timestamp: "10 mins ago",
    terminal: "Lane 01",
  },
  {
    id: "ord-102",
    orderNumber: "INV-2026-902",
    customerName: "Nusrat Jahan",
    customerPhone: "+880 1822-890123",
    paymentMethod: "bKash Merchant",
    itemsSummary: "Anker Soundcore R50i + Type-C Cable",
    itemsCount: 2,
    subtotal: 2500,
    vat: 125,
    total: 2625,
    status: "SETTLED",
    timestamp: "28 mins ago",
    terminal: "Lane 01",
  },
  {
    id: "ord-103",
    orderNumber: "INV-2026-903",
    customerName: "Mahmud Hasan",
    customerPhone: "+880 1912-345678",
    paymentMethod: "Cash (COD)",
    itemsSummary: "Samsung Galaxy A15 5G (8GB/128GB)",
    itemsCount: 1,
    subtotal: 22999,
    vat: 1150,
    total: 24149,
    status: "SETTLED",
    timestamp: "1 hour ago",
    terminal: "Lane 01",
  },
  {
    id: "ord-104",
    orderNumber: "INV-2026-904",
    customerName: "Walk-in Customer",
    paymentMethod: "Cash (COD)",
    itemsSummary: "9D Privacy Tempered Glass Protector (x2)",
    itemsCount: 2,
    subtotal: 500,
    vat: 25,
    total: 525,
    status: "SETTLED",
    timestamp: "2 hours ago",
    terminal: "Lane 02",
  },
  {
    id: "ord-105",
    orderNumber: "INV-2026-905",
    customerName: "Kamrul Ahsan",
    customerPhone: "+880 1613-567890",
    paymentMethod: "Visa/Mastercard",
    itemsSummary: "Apple 20W USB-C Adapter + Cafule Cable",
    itemsCount: 2,
    subtotal: 3450,
    vat: 173,
    total: 3623,
    status: "SETTLED",
    timestamp: "3 hours ago",
    terminal: "Lane 01",
  },
];
