import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@clerk/nextjs/server";
import { TrendingUp } from "lucide-react";
import { redirect } from "next/navigation";

export default async function AdminReportsPage() {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/admin/unauthorized");
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
