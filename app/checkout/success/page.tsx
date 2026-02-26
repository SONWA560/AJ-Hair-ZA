import Link from "next/link";
import { Button } from "components/ui/button";
import { CheckCircle } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-900 px-4">
      <div className="text-center">
        <div className="mb-6">
          <Breadcrumb items={[{ title: "Checkout" }, { title: "Success" }]} />
        </div>
        <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Order Placed Successfully!</h1>
        <p className="text-muted-foreground mb-6">
          Thank you for your order. We'll send you a confirmation email shortly.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Order #{(Math.random() * 1000000).toFixed(0).padStart(6, "0")}
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
