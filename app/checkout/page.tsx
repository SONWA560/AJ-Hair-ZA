"use client";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { completeOrder, placeOrder } from "@/lib/actions";
import { useAuth } from "@clerk/nextjs";
import { useCart } from "components/cart/cart-context";
import { CheckoutOne } from "components/commercn/checkouts/checkout-01";
import { Button } from "components/ui/button";
import { Card, CardContent } from "components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CheckoutPage() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const { cart, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<"shipping" | "payment">(
    "shipping",
  );
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [shippingDetails, setShippingDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    suburb: "",
    city: "",
    province: "",
    postalCode: "",
  });

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              ← Continue Shopping
            </Link>
          </div>
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <h2 className="mb-2 text-xl font-semibold">
                Sign in to Checkout
              </h2>
              <p className="mb-4 text-muted-foreground">
                Please sign in to complete your purchase
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/sign-in">
                  <Button>Sign In</Button>
                </Link>
                <Link href="/sign-up">
                  <Button variant="outline">Sign Up</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              ← Continue Shopping
            </Link>
          </div>
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <h2 className="mb-2 text-xl font-semibold">Your cart is empty</h2>
              <p className="mb-4 text-muted-foreground">
                Add some products to your cart first
              </p>
              <Link href="/">
                <Button>Continue Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleContinueToPayment = () => {
    setCheckoutStep("payment");
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    setOrderError(null);

    try {
      const orderResult = await placeOrder({
        items: cart.items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          variant: item.variant,
        })),
        subtotal: cart.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        ),
        tax: Math.round(
          cart.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          ) * 0.15,
        ),
        shipping: 0,
        total:
          cart.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          ) +
          Math.round(
            cart.items.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0,
            ) * 0.15,
          ),
        shippingDetails: shippingDetails,
        paymentMethod: paymentMethod,
      });

      if (!orderResult.success) {
        setOrderError(orderResult.error ?? "Failed to place order. Please try again.");
        setIsProcessing(false);
        return;
      }

      if (orderResult.orderId) {
        await completeOrder(orderResult.orderId);
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
      clearCart();
      router.push("/checkout/success");
    } catch (error) {
      console.error("Error placing order:", error);
      setOrderError("Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const tax = Math.round(subtotal * 0.15);
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Breadcrumb
            items={[{ title: "Home", href: "/" }, { title: "Checkout" }]}
          />
        </div>

        <h1 className="mb-8 text-3xl font-bold">Checkout</h1>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center">
          <div className="flex items-center">
            <div
              className={`flex items-center gap-2 rounded-full px-4 py-2 ${checkoutStep === "shipping" ? "bg-blue-600 text-white" : "bg-green-600 text-white"}`}
            >
              <span>1</span>
              <span className="hidden sm:inline">Shipping</span>
            </div>
            <div className="h-0.5 w-8 bg-neutral-300 dark:bg-neutral-700" />
            <div
              className={`flex items-center gap-2 rounded-full px-4 py-2 ${checkoutStep === "payment" ? "bg-blue-600 text-white" : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800"}`}
            >
              <span>2</span>
              <span className="hidden sm:inline">Payment</span>
            </div>
          </div>
        </div>

        {checkoutStep === "shipping" ? (
          <CheckoutOne
            onContinueToPayment={handleContinueToPayment}
            shippingDetails={shippingDetails}
            setShippingDetails={setShippingDetails}
          />
        ) : (
          <PaymentStep
            total={total}
            isProcessing={isProcessing}
            orderError={orderError}
            onPlaceOrder={handlePlaceOrder}
            onBack={() => setCheckoutStep("shipping")}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
          />
        )}
      </div>
    </div>
  );
}

function PaymentStep({
  total,
  isProcessing,
  orderError,
  onPlaceOrder,
  onBack,
  paymentMethod,
  setPaymentMethod,
}: {
  total: number;
  isProcessing: boolean;
  orderError: string | null;
  onPlaceOrder: () => void;
  onBack: () => void;
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
}) {
  return (
    <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-start gap-8">
      <div className="w-full order-2 md:order-1">
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="text-lg font-semibold mb-4">Payment Method</h3>

          {orderError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {orderError}
            </div>
          )}

          <div className="space-y-4 mb-6">
            {[
              { value: "card", label: "Credit / Debit Card" },
              { value: "eft", label: "Instant EFT" },
              { value: "cod", label: "Cash on Delivery" },
              { value: "paypal", label: "PayPal" },
            ].map(({ value, label }) => (
              <label
                key={value}
                className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                  paymentMethod === value
                    ? "border-blue-500 bg-blue-50"
                    : "hover:bg-neutral-50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={value}
                  checked={paymentMethod === value}
                  onChange={() => setPaymentMethod(value)}
                  className="h-4 w-4"
                />
                <span className="font-medium">{label}</span>
              </label>
            ))}
          </div>

          {paymentMethod === "card" && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <label htmlFor="cardNumber" className="text-sm font-medium">
                  Card Number
                </label>
                <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="expiry" className="text-sm font-medium">
                    Expiry Date
                  </label>
                  <Input id="expiry" placeholder="MM/YY" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="cvc" className="text-sm font-medium">
                    CVC
                  </label>
                  <Input id="cvc" placeholder="123" />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === "paypal" && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                You will be redirected to PayPal to complete your payment.
              </p>
            </div>
          )}

          {paymentMethod === "cod" && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Pay when your order is delivered. Our driver will collect
                payment on arrival.
              </p>
            </div>
          )}

          <div className="flex gap-4 mt-6">
            <Button variant="outline" onClick={onBack} className="flex-1">
              Back
            </Button>
            <Button
              onClick={onPlaceOrder}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing
                ? "Processing..."
                : `Pay R${total.toLocaleString()}`}
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[400px] bg-gray-50 border p-4 rounded-xl order-1 md:order-2">
        <h4 className="text-lg font-medium mb-4">Order Summary</h4>
        <div className="flex justify-between mb-2">
          <span className="text-sm">Total</span>
          <span className="text-xl font-medium">R{total.toLocaleString()}</span>
        </div>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mt-4 block"
        >
          ← Continue Shopping
        </Link>
      </div>
    </div>
  );
}

import { Input } from "components/ui/input";
