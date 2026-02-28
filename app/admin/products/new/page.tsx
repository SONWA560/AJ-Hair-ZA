import { auth } from "@clerk/nextjs/server";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductForm } from "../_components/product-form";

export default async function NewProductPage() {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/admin/unauthorized");

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Products
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
        <p className="text-muted-foreground">Create a new product listing</p>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}
