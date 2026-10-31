import { OrdersWorkspace } from "@/features/pos/components/orders-workspace";

export const metadata = {
  title: "Store Orders & Sales — SunTech POS",
  description: "Monitor all branch sales transactions, tickets, and customer returns.",
};

export default function AdminOrdersPage() {
  return <OrdersWorkspace role="admin" />;
}
