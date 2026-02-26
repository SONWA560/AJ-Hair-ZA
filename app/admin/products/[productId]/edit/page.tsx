import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getProductById } from "@/lib/firebase/firestore";
import { EditProductForm } from "./edit-form";

interface Props {
  params: Promise<{ productId: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { userId } = await auth();
  const { productId } = await params;
  
  if (!userId) {
    redirect("/sign-in?redirect_url=/admin/products");
  }

  const product = await getProductById(productId);

  if (!product) {
    redirect("/admin/products");
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-gray-500">Update product details</p>
      </div>
      
      <EditProductForm product={product} />
    </div>
  );
}
