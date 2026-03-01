"use client";

import { updateOrderStatus } from "@/lib/actions";
import { useState, useTransition } from "react";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "processing", label: "Processing", color: "bg-blue-100 text-blue-800" },
  { value: "shipped", label: "Shipped", color: "bg-purple-100 text-purple-800" },
  { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
] as const;

type OrderStatus = (typeof STATUS_OPTIONS)[number]["value"];

interface Props {
  orderId: string;
  currentStatus: string;
}

export function OrderStatusSelect({ orderId, currentStatus }: Props) {
  const [status, setStatus] = useState<OrderStatus>(
    (STATUS_OPTIONS.some((s) => s.value === currentStatus)
      ? currentStatus
      : "pending") as OrderStatus,
  );
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as OrderStatus;
    setStatus(next);
    startTransition(async () => {
      await updateOrderStatus(orderId, next);
    });
  }

  const current = STATUS_OPTIONS.find((s) => s.value === status);

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={isPending}
      className={`rounded-full border-0 px-3 py-1 text-xs font-medium outline-none ring-1 ring-inset ring-transparent focus:ring-blue-500 disabled:opacity-60 ${current?.color ?? ""}`}
      aria-label="Change order status"
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
