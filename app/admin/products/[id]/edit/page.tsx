import { getProductForEdit } from "@/lib/product-actions";
import { auth } from "@clerk/nextjs/server";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductForm } from "../../_components/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/admin/unauthorized");

  const { id } = await params;
  const product = await getProductForEdit(id);
  if (!product) notFound();

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
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-muted-foreground truncate max-w-md">{product.title}</p>
      </div>
      <ProductForm mode="edit" productId={id} defaultValues={product} />
    </div>
  );
}
