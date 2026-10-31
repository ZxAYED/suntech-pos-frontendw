import { OrdersWorkspace } from "@/features/pos/components/orders-workspace";

export const metadata = {
  title: "Register Tickets & Orders — SunTech POS",
  description: "Track sales receipts, search invoices, and process refunds.",
};

export default function PosOrdersPage() {
  return <OrdersWorkspace role="cashier" />;
}
