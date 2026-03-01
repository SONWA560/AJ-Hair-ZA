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
import { getAdminOrderById } from "@/lib/firebase/firestore";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OrderStatusSelect } from "../_components/order-status-select";

const PAYMENT_LABELS: Record<string, string> = {
  card: "Card",
  eft: "EFT",
  cod: "Cash on Delivery",
  paypal: "PayPal",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/admin/unauthorized");

  const { id } = await params;
  const order: any = await getAdminOrderById(id);
  if (!order) notFound();

  const fmt = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/orders"
            className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to orders
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {order.createdAt
              ? new Date(order.createdAt).toLocaleString("en-ZA")
              : "Unknown date"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Status:</span>
          <OrderStatusSelect orderId={order.id} currentStatus={order.status ?? "pending"} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Items ({order.items?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="pr-6 text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(order.items ?? []).map((item: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-12 w-12 rounded-md object-cover"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {fmt.format(item.price ?? 0)} each
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-xs text-muted-foreground">
                          {item.hairType && <p>Type: {item.hairType}</p>}
                          {item.length && <p>Length: {item.length}</p>}
                          {item.color && <p>Color: {item.color}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity ?? 1}</TableCell>
                      <TableCell className="pr-6 text-right font-medium">
                        {fmt.format((item.price ?? 0) * (item.quantity ?? 1))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Price breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Price Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{fmt.format(order.subtotal ?? 0)}</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (VAT)</span>
                    <span>{fmt.format(order.tax ?? 0)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {order.shipping > 0 ? fmt.format(order.shipping) : "Free"}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <span>Total</span>
                  <span>{fmt.format(order.total ?? 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{order.customerName || "Guest"}</p>
              {order.customerEmail && (
                <p className="text-muted-foreground">{order.customerEmail}</p>
              )}
              {order.customerPhone && (
                <p className="text-muted-foreground">{order.customerPhone}</p>
              )}
            </CardContent>
          </Card>

          {/* Shipping address */}
          {order.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0.5 text-sm text-muted-foreground">
                {order.shippingAddress.street && (
                  <p>{order.shippingAddress.street}</p>
                )}
                {order.shippingAddress.suburb && (
                  <p>{order.shippingAddress.suburb}</p>
                )}
                <p>
                  {[
                    order.shippingAddress.city,
                    order.shippingAddress.province,
                    order.shippingAddress.postalCode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium">
                  {PAYMENT_LABELS[order.paymentMethod] ||
                    order.paymentMethod ||
                    "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Order status</span>
                <Badge
                  className={
                    STATUS_COLORS[order.status] ??
                    "bg-gray-100 text-gray-800 hover:bg-gray-100"
                  }
                >
                  {order.status ?? "unknown"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
