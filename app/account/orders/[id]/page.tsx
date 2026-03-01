import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getAdminOrderById } from "@/lib/firebase/firestore";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

const PAYMENT_LABELS: Record<string, string> = {
  card: "Credit / Debit Card",
  eft: "Instant EFT",
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

function formatDate(value: any): string {
  if (!value) return "—";
  try {
    const d = value instanceof Date ? value : new Date(value);
    return d.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const { id } = await params;
  const order: any = await getAdminOrderById(id);

  // Verify ownership — customers may only view their own orders
  if (!order || order.userId !== user.id) {
    notFound();
  }

  const fmt = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/account"
          className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to my account
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              Order #{order.id.slice(0, 8)}
            </h1>
            <p className="text-sm text-muted-foreground">
              Placed on{" "}
              {formatDate(order.timestamps?.createdAt ?? order.createdAt)}
            </p>
          </div>
          <Badge
            className={
              STATUS_COLORS[order.status] ??
              "bg-gray-100 text-gray-800 hover:bg-gray-100"
            }
          >
            {order.status ?? "pending"}
          </Badge>
        </div>
      </div>

      <div className="space-y-6">
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
                  <TableHead>Details</TableHead>
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
                            className="h-14 w-14 rounded-lg object-cover"
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
                    <TableCell className="text-right">
                      {item.quantity ?? 1}
                    </TableCell>
                    <TableCell className="pr-6 text-right font-medium">
                      {fmt.format((item.price ?? 0) * (item.quantity ?? 1))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Price breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{fmt.format(order.subtotal ?? 0)}</span>
              </div>
              {(order.tax ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT (15%)</span>
                  <span>{fmt.format(order.tax)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {(order.shipping ?? 0) > 0
                    ? fmt.format(order.shipping)
                    : "Free"}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>Total</span>
                <span>{fmt.format(order.total ?? 0)}</span>
              </div>
              <div className="flex justify-between pt-1 text-xs text-muted-foreground">
                <span>Payment</span>
                <span>
                  {PAYMENT_LABELS[order.paymentMethod] ||
                    order.paymentMethod ||
                    "—"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping address */}
          {order.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Delivery Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-medium">{order.customerName}</p>
                {order.customerPhone && (
                  <p className="text-muted-foreground">
                    {order.customerPhone}
                  </p>
                )}
                <div className="pt-1 text-muted-foreground">
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
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline"
          >
            Continue shopping →
          </Link>
        </div>
      </div>
    </div>
  );
}
