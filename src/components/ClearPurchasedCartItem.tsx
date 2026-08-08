"use client";

import { useEffect } from "react";
import { useCart } from "@/components/CartProvider";

/** Removes a purchased course/bundle from the cart after successful checkout. */
export function ClearPurchasedCartItem({ slug }: { slug: string }) {
  const { removeBySlug } = useCart();

  useEffect(() => {
    if (slug) removeBySlug(slug);
  }, [slug, removeBySlug]);

  return null;
}
