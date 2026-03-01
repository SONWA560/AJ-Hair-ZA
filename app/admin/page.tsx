import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getReportData } from "@/lib/firebase/firestore";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, DollarSign, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminDashboard() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/unauthorized");

  const { orders, products } = await getReportData();

  const completedOrders = orders.filter((o: any) => o.status === "completed");
  const pendingOrders = orders.filter((o: any) => o.status === "pending");

  const totalRevenue = completedOrders.reduce(
    (sum: number, o: any) => sum + (o.total || 0),
    0,
  );

  // Unique customers derived from orders (same logic as reports page)
  const customerSet = new Set(
    orders.map((o: any) => o.userId || o.customerEmail || null).filter(Boolean),
  );
  const totalCustomers = customerSet.size;

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Here&apos;s an overview of your store.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From {completedOrders.length} completed order{completedOrders.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingOrders.length} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              {products.filter((p: any) => p.inventory?.inStock).length} in stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Unique buyers</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Link
          href="/admin/products"
          className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <p className="font-medium">Manage Products</p>
              <p className="text-sm text-gray-500">Add, edit, or remove products</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400" />
        </Link>

        <Link
          href="/admin/orders"
          className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-medium">View Orders</p>
              <p className="text-sm text-gray-500">Track and manage orders</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400" />
        </Link>

        <Link
          href="/admin/reports"
          className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div>
              <p className="font-medium">View Reports</p>
              <p className="text-sm text-gray-500">Financial and analytics</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400" />
        </Link>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentOrders.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No orders yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {order.id.slice(0, 8)}…
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{order.customerName || "Guest"}</p>
                      <p className="text-xs text-muted-foreground">{order.customerEmail || ""}</p>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.total || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          order.status === "completed"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                        }
                      >
                        {order.status ?? "unknown"}
                      </Badge>
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
