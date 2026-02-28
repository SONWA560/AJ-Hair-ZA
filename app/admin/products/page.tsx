import { getAdminProducts } from "@/lib/product-actions";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ProductsTable } from "./_components/products-table";

export default async function AdminProductsPage() {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/admin/unauthorized");

  const products = await getAdminProducts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-muted-foreground">
          {products.length} product{products.length !== 1 ? "s" : ""} in your store
        </p>
      </div>
      <ProductsTable products={products} />
    </div>
  );
}
