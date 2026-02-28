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
import { redirect } from "next/navigation";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminReportsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/unauthorized");

  const { orders, products } = await getReportData();

  const completedOrders = orders.filter((o: any) => o.status === "completed");

  // ── Financial Report ──────────────────────────────────────────────────────
  const totalRevenue = completedOrders.reduce(
    (sum: number, o: any) => sum + (o.total || 0),
    0,
  );

  const productCostMap = new Map<string, number>();
  for (const p of products) {
    productCostMap.set((p as any).id, (p as any).cost ?? 0);
  }

  let totalCost = 0;
  for (const o of completedOrders) {
    for (const item of (o.items || []) as any[]) {
      const cost = productCostMap.get(item.productId) ?? 0;
      totalCost += cost * (item.quantity || 1);
    }
  }
  const grossProfit = totalRevenue - totalCost;

  const monthlyMap = new Map<string, number>();
  for (const o of completedOrders) {
    const d = o.createdAt ? new Date(o.createdAt) : null;
    if (!d) continue;
    const key = d.toLocaleDateString("en-ZA", { year: "numeric", month: "short" });
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + (o.total || 0));
  }
  const monthlyRevenue = Array.from(monthlyMap.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .slice(-6);

  const productRevenueMap = new Map<string, { title: string; revenue: number; qty: number }>();
  for (const o of completedOrders) {
    for (const item of (o.items || []) as any[]) {
      const key = item.productId || item.title;
      const existing = productRevenueMap.get(key) ?? { title: item.title || key, revenue: 0, qty: 0 };
      existing.revenue += (item.price || 0) * (item.quantity || 1);
      existing.qty += item.quantity || 1;
      productRevenueMap.set(key, existing);
    }
  }
  const topByRevenue = Array.from(productRevenueMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // ── Product Report ─────────────────────────────────────────────────────────
  const soldMap = new Map<string, { title: string; qty: number; revenue: number }>();
  for (const o of orders) {
    for (const item of (o.items || []) as any[]) {
      const key = item.productId || item.title;
      const existing = soldMap.get(key) ?? { title: item.title || key, qty: 0, revenue: 0 };
      existing.qty += item.quantity || 1;
      existing.revenue += (item.price || 0) * (item.quantity || 1);
      soldMap.set(key, existing);
    }
  }
  const bestSelling = Array.from(soldMap.values()).sort((a, b) => b.qty - a.qty).slice(0, 10);

  const mostViewed = [...products]
    .sort((a: any, b: any) => (b.metadata?.views || 0) - (a.metadata?.views || 0))
    .slice(0, 10) as any[];

  const inStockCount = products.filter((p: any) => p.inventory?.inStock).length;
  const outOfStockCount = products.length - inStockCount;

  const soldProductIds = new Set(soldMap.keys());
  const neverSold = products.filter((p: any) => !soldProductIds.has(p.id)).slice(0, 10) as any[];

  // ── Customer Report ────────────────────────────────────────────────────────
  const customerMap = new Map<string, { name: string; email: string; spend: number; orderCount: number }>();
  for (const o of orders) {
    const key = (o as any).userId || (o as any).customerEmail || "guest";
    const existing = customerMap.get(key) ?? {
      name: (o as any).customerName || "Guest",
      email: (o as any).customerEmail || "",
      spend: 0,
      orderCount: 0,
    };
    existing.spend += (o as any).total || 0;
    existing.orderCount += 1;
    customerMap.set(key, existing);
  }
  const topCustomers = Array.from(customerMap.values()).sort((a, b) => b.spend - a.spend).slice(0, 10);
  const totalCustomers = customerMap.size;
  const avgOrderValue =
    orders.length > 0
      ? orders.reduce((s: number, o: any) => s + (o.total || 0), 0) / orders.length
      : 0;

  const provinceMap = new Map<string, number>();
  for (const o of orders) {
    const province = (o as any).shippingAddress?.province || "Unknown";
    provinceMap.set(province, (provinceMap.get(province) ?? 0) + 1);
  }
  const provinceData = Array.from(provinceMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500">Analytics and insights for your store</p>
      </div>

      {/* ── Financial Report ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Financial Report</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Completed orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-500">{formatCurrency(totalCost)}</p>
              <p className="text-xs text-muted-foreground">Based on product cost field</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gross Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${grossProfit >= 0 ? "text-green-700" : "text-red-600"}`}>
                {formatCurrency(grossProfit)}
              </p>
              <p className="text-xs text-muted-foreground">Revenue − Cost</p>
            </CardContent>
          </Card>
        </div>

        {monthlyRevenue.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Revenue by Month (last 6 months)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyRevenue.map(([month, revenue]) => (
                    <TableRow key={month}>
                      <TableCell>{month}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {topByRevenue.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Top 5 Products by Revenue</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Units Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topByRevenue.map((p) => (
                    <TableRow key={p.title}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell className="text-right">{p.qty}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ── Product Report ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Product Report</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{inStockCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-500">{outOfStockCount}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Best-Selling Products</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {bestSelling.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">No sales data yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Units Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bestSelling.map((p) => (
                    <TableRow key={p.title}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell className="text-right">{p.qty}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Most Viewed Products</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {mostViewed.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">No view data yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mostViewed.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell className="text-right">{p.metadata?.views ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {neverSold.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Products with No Sales</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Hair Type</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {neverSold.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.specifications?.hair_type?.replace(/_/g, " ") || "—"}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(p.price || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ── Customer Report ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Customer Report</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalCustomers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{orders.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Order Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Customers by Spend</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topCustomers.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">No customer data yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Total Spend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomers.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.email || "—"}</TableCell>
                      <TableCell className="text-right">{c.orderCount}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(c.spend)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {provinceData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Orders by Province</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Province</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {provinceData.map(([province, count]) => (
                    <TableRow key={province}>
                      <TableCell>{province}</TableCell>
                      <TableCell className="text-right">{count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
