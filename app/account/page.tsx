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
import { getOrdersByUserId } from "@/lib/firebase/firestore";
import { getWishlistProductIds } from "@/lib/wishlist-actions";
import { currentUser } from "@clerk/nextjs/server";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

const PAYMENT_LABELS: Record<string, string> = {
  card: "Card",
  eft: "EFT",
  cod: "Cash on Delivery",
  paypal: "PayPal",
};

function StatusBadge({ status }: { status: string }) {
  const isComplete = status === "completed" || status === "delivered";
  const isPending = status === "pending" || status === "processing";
  return (
    <Badge
      className={
        isComplete
          ? "bg-green-100 text-green-800 hover:bg-green-100"
          : isPending
            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
            : "bg-neutral-100 text-neutral-800 hover:bg-neutral-100"
      }
    >
      {status}
    </Badge>
  );
}

function formatDate(value: any): string {
  if (!value) return "—";
  try {
    const d = value instanceof Date ? value : new Date(value);
    return d.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const [orders, wishlistIds] = await Promise.all([
    getOrdersByUserId(user.id),
    getWishlistProductIds(user.id),
  ]);

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.emailAddresses[0]?.emailAddress?.split("@")[0] ||
    "Member";

  const email = user.emailAddresses[0]?.emailAddress ?? "";

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
      })
    : "—";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold">My Account</h1>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Profile card */}
        <div className="w-full lg:w-1/3">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 text-center">
              <div className="relative h-20 w-20 overflow-hidden rounded-full bg-neutral-100">
                {user.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={displayName}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-neutral-500">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <p className="text-lg font-semibold">{displayName}</p>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>

              <div className="w-full border-t pt-3 text-sm text-muted-foreground">
                Member since{" "}
                <span className="font-medium text-foreground">{memberSince}</span>
              </div>

              <Link
                href="/account/wishlist"
                className="mt-1 flex w-full items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                <Heart size={16} className="text-red-500" />
                My Wishlist
                {wishlistIds.length > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {wishlistIds.length}
                  </span>
                )}
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Order history */}
        <div className="w-full lg:w-2/3">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No orders yet.</p>
                  <Link
                    href="/"
                    className="mt-3 inline-block text-sm font-medium underline underline-offset-4"
                  >
                    Start shopping
                  </Link>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {String(order.id).slice(0, 8)}…
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(
                            order.timestamps?.createdAt ?? order.createdAt,
                          )}
                        </TableCell>
                        <TableCell>
                          {Array.isArray(order.items) ? order.items.length : 0}
                        </TableCell>
                        <TableCell className="font-medium">
                          {new Intl.NumberFormat("en-ZA", {
                            style: "currency",
                            currency: "ZAR",
                            maximumFractionDigits: 0,
                          }).format(order.total ?? 0)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {PAYMENT_LABELS[order.paymentMethod] ||
                            order.paymentMethod ||
                            "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status ?? "pending"} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
