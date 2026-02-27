"use client";

import { ShoppingCartIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ShoppingBagIcon } from "@heroicons/react/24/solid";
import { useCart } from "./cart-context";
import { useState } from "react";
import Image from "next/image";
import { MinusIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

const formatMoney = (amount: string) => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(parseFloat(amount));
};

export default function CartModal() {
  const { cart, updateCartItem } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const totalQuantity =
    cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // REMOVED: Auto-open effect that was causing checkout page issues
  // Users can manually open the cart by clicking the cart icon

  if (!isOpen) {
    return (
      <button
        aria-label="Open cart"
        className="relative"
        onClick={() => setIsOpen(true)}
      >
        <ShoppingBagIcon className="h-6 w-6" />
        {totalQuantity > 0 && (
          <div className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
            {totalQuantity}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={() => setIsOpen(false)}
      />

      {/* Cart Panel */}
      <div className="relative ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold">Shopping Cart</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4">
          {!cart || !cart.items || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <ShoppingCartIcon className="h-16 w-16 text-gray-400" />
              <p className="mt-6 text-center text-2xl font-bold">
                Your cart is empty.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex gap-4 border-b border-gray-200 pb-4"
                >
                  <div className="relative h-20 w-20 flex-shrink-0">
                    <Image
                      className="object-cover rounded"
                      width={80}
                      height={80}
                      alt={item.title}
                      src={item.image}
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-gray-600">
                      {item.variant.hair_type} • {item.variant.length} •{" "}
                      {item.variant.color}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartItem(item.id, "minus")}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300"
                        >
                          <MinusIcon className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItem(item.id, "plus")}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300"
                        >
                          <PlusIcon className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-semibold">
                          {formatMoney((item.price * item.quantity).toString())}
                        </span>
                        <button
                          onClick={() => updateCartItem(item.id, "delete")}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart && cart.items && cart.items.length > 0 && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex justify-between mb-4">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-lg">
                {formatMoney(cart.total.toString())}
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={() => setIsOpen(false)}
              className="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 text-center"
            >
              Checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
