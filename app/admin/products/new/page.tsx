import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ProductForm } from "./product-form";

export default async function NewProductPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in?redirect_url=/admin/products/new");
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
        <p className="text-gray-500">Create a new product in your inventory</p>
      </div>
      
      <ProductForm />
    </div>
  );
}
