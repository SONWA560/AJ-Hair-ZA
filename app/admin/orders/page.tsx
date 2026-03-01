import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getAdminOrders } from "@/lib/firebase/firestore";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderStatusSelect } from "./_components/order-status-select";

const PAYMENT_LABELS: Record<string, string> = {
  card: "Card",
  eft: "EFT",
  cod: "Cash on Delivery",
  paypal: "PayPal",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/admin/unauthorized");

  const params = await searchParams;
  const orders: any[] = await getAdminOrders(params.status);

  const completedOrders = orders.filter((o) => o.status === "completed");
  const totalRevenue = completedOrders.reduce(
    (sum, o) => sum + (o.total || 0),
    0,
  );
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500">
          {orders.length} order{orders.length !== 1 ? "s" : ""}
          {params.status ? ` — ${params.status}` : ""}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat("en-ZA", {
                style: "currency",
                currency: "ZAR",
                maximumFractionDigits: 0,
              }).format(totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { label: "All Orders", href: "/admin/orders", status: undefined },
          {
            label: "Pending",
            href: "/admin/orders?status=pending",
            status: "pending",
          },
          {
            label: "Processing",
            href: "/admin/orders?status=processing",
            status: "processing",
          },
          {
            label: "Shipped",
            href: "/admin/orders?status=shipped",
            status: "shipped",
          },
          {
            label: "Completed",
            href: "/admin/orders?status=completed",
            status: "completed",
          },
        ].map(({ label, href, status }) => {
          const isActive = params.status === status;
          return (
            <Link
              key={label}
              href={href}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Orders table */}
      <Card>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground">No orders found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="group">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="hover:underline"
                      >
                        {order.id.slice(0, 8)}…
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/orders/${order.id}`} className="block">
                        <p className="text-sm font-medium">
                          {order.customerName || "Guest"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.customerEmail || ""}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell>{order.items?.length ?? 0}</TableCell>
                    <TableCell className="text-sm">
                      {PAYMENT_LABELS[order.paymentMethod] ||
                        order.paymentMethod ||
                        "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {new Intl.NumberFormat("en-ZA", {
                        style: "currency",
                        currency: "ZAR",
                        maximumFractionDigits: 0,
                      }).format(order.total || 0)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusSelect
                        orderId={order.id}
                        currentStatus={order.status ?? "pending"}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString("en-ZA")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
