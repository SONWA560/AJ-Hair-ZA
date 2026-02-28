"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useCart } from "components/cart/cart-context";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ArrowRight } from "lucide-react";

const southAfricanProvinces = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Free State",
];

interface CheckoutOneProps {
  onContinueToPayment?: () => void;
  shippingDetails?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    suburb: string;
    city: string;
    province: string;
    postalCode: string;
  };
  setShippingDetails?: (details: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    suburb: string;
    city: string;
    province: string;
    postalCode: string;
  }) => void;
}

export function CheckoutOne({
  onContinueToPayment,
  shippingDetails,
  setShippingDetails,
}: CheckoutOneProps) {
  const { cart, updateCartItem } = useCart();
  const [shippingMethod, setShippingMethod] = useState<"home" | "pickup">(
    "home",
  );
  const [formData, setFormData] = useState(
    shippingDetails || {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      province: "",
      suburb: "",
      postalCode: "",
    },
  );

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    if (setShippingDetails) {
      setShippingDetails(newData);
    }
  };

  const subtotal =
    cart?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) ||
    0;
  const shipping = shippingMethod === "home" ? 0 : 0;
  const tax = Math.round(subtotal * 0.15);
  const total = subtotal + shipping + tax;

  const formatPrice = (price: number) => `R${price.toLocaleString()}`;

  return (
    <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-start gap-8">
      <div className="w-full order-2 md:order-1">
        <form>
          <FieldGroup>
            <FieldSet>
              <FieldLegend>Shipping address</FieldLegend>
              <FieldGroup className="gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="first-name">First name</FieldLabel>
                    <Input
                      id="first-name"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="last-name">Last name</FieldLabel>
                    <Input
                      id="last-name"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      required
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+27 82 123 4567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="street-address">
                    Street Address
                  </FieldLabel>
                  <Input
                    id="street-address"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    placeholder="123 Main Street"
                    required
                  />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="suburb">Suburb</FieldLabel>
                    <Input
                      id="suburb"
                      value={formData.suburb}
                      onChange={(e) =>
                        handleInputChange("suburb", e.target.value)
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="city">City</FieldLabel>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        handleInputChange("city", e.target.value)
                      }
                      required
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="province">Province</FieldLabel>
                    <Select
                      value={formData.province}
                      onValueChange={(value) =>
                        handleInputChange("province", value)
                      }
                    >
                      <SelectTrigger id="province">
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        {southAfricanProvinces.map((province) => (
                          <SelectItem key={province} value={province}>
                            {province}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="postalCode">Postal Code</FieldLabel>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) =>
                        handleInputChange("postalCode", e.target.value)
                      }
                      placeholder="2000"
                      required
                    />
                  </Field>
                </div>
              </FieldGroup>
            </FieldSet>
            <FieldSet>
              <FieldLegend>Shipping method</FieldLegend>
              <RadioGroup
                defaultValue="home"
                onValueChange={(value) =>
                  setShippingMethod(value as "home" | "pickup")
                }
                className="flex flex-col lg:flex-row gap-4"
              >
                <div
                  className={`flex flex-1 items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    shippingMethod === "home"
                      ? "border-gray-500 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <RadioGroupItem value="home" id="home" />
                  <Label
                    htmlFor="home"
                    className="cursor-pointer flex-col items-start flex-1"
                  >
                    <div className="font-medium">Standard Delivery</div>
                    <div className="text-sm text-muted-foreground">
                      5-7 business days - Free
                    </div>
                  </Label>
                </div>
                <div
                  className={`flex flex-1 items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    shippingMethod === "pickup"
                      ? "border-gray-500 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label
                    htmlFor="pickup"
                    className="cursor-pointer flex-col items-start flex-1"
                  >
                    <div className="font-medium">Express Delivery</div>
                    <div className="text-sm text-muted-foreground">
                      1-2 business days - R150
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </FieldSet>
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full h-12 bg-black text-white hover:bg-gray-800"
                onClick={(e) => {
                  e.preventDefault();
                  if (onContinueToPayment) onContinueToPayment();
                }}
              >
                Continue to Payment <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </FieldGroup>
        </form>
      </div>

      <div className="w-full max-w-[400px] bg-gray-50 border p-4 rounded-xl order-1 md:order-2">
        <h4 className="text-lg font-medium mb-6">Order Summary</h4>

        <ul className="space-y-4 max-h-[300px] overflow-y-auto">
          {cart?.items?.map((item) => (
            <li key={item.id} className="flex gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                {item.variant && (
                  <p className="text-xs text-muted-foreground">
                    {item.variant.length} / {item.variant.color}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <button
                    onClick={() => updateCartItem(item.id, "minus")}
                    className="h-6 w-6 rounded border flex items-center justify-center hover:bg-neutral-100"
                    type="button"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-xs w-6 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartItem(item.id, "plus")}
                    className="h-6 w-6 rounded border flex items-center justify-center hover:bg-neutral-100"
                    type="button"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <p className="font-medium text-sm">
                R{(item.price * item.quantity).toLocaleString()}
              </p>
            </li>
          ))}
          {!cart?.items?.length && (
            <li className="text-sm text-muted-foreground text-center py-4">
              Your cart is empty
            </li>
          )}
        </ul>

        <hr className="my-4" />

        <ul className="space-y-2">
          <li className="flex justify-between">
            <h5 className="text-sm">Subtotal</h5>
            <p className="font-medium">{formatPrice(subtotal)}</p>
          </li>
          <li className="flex justify-between">
            <h5 className="text-sm">Shipping</h5>
            <p className="font-medium">
              {shipping === 0 ? "Free" : formatPrice(shipping)}
            </p>
          </li>
          <li className="flex justify-between">
            <h5 className="text-sm">VAT (15%)</h5>
            <p className="font-medium">{formatPrice(tax)}</p>
          </li>

          <hr className="my-4" />
          <li className="flex justify-between">
            <h5 className="text-lg font-medium">Total</h5>
            <p className="text-xl font-medium">{formatPrice(total)}</p>
          </li>
        </ul>

        <div className="mt-4">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
