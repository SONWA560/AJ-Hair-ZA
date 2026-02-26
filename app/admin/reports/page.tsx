import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, Package } from "lucide-react";

export default async function AdminReportsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in?redirect=/admin/reports");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500">Analytics and insights for your store</p>
      </div>

      {/* Reports Placeholder */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingUp className="h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">Reports Loading...</h3>
          <p className="text-sm text-gray-500">Reports are being set up. Please check back soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
