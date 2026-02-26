import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Filter } from "lucide-react";
import Link from "next/link";

// Server-side data fetching will be done via API routes
// This is a placeholder - actual data fetching will be implemented

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in?redirect=/admin/orders");
  }

  // For now, allow any logged-in user
  // Admin check will be implemented later
  const params = await searchParams;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500">Track and manage customer orders</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Link
          href="/admin/orders"
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            !params.status 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Orders
        </Link>
        <Link
          href="/admin/orders?status=pending"
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            params.status === 'pending'
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pending
        </Link>
        <Link
          href="/admin/orders?status=completed"
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            params.status === 'completed'
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Completed
        </Link>
      </div>

      {/* Orders Table - Placeholder */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ShoppingCart className="h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">Orders Loading...</h3>
          <p className="text-sm text-gray-500">
            Order management is being set up. Please check back soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
