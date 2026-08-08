"use client";

import { useCart } from "@/components/CartProvider";
import type { CartItem } from "@/lib/cart";

export function AddToCartButton({
  item,
  className,
}: {
  item: Omit<CartItem, "key">;
  className?: string;
}) {
  const { addItem, hasItem, setOpen } = useCart();
  const inCart = hasItem(item.kind, item.id);

  if (inCart) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`btn btn-ghost w-full ${className || ""}`}
      >
        View cart
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => addItem(item)}
      className={`btn btn-navy w-full ${className || ""}`}
    >
      Add to cart
    </button>
  );
}
