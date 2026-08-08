"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  cartItemKey,
  cartTotalCents,
  type CartItem,
} from "@/lib/cart";

const STORAGE_KEY = "rodzedu-cart-v1";

type CartContextValue = {
  items: CartItem[];
  count: number;
  totalCents: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItem, "key">) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  removeBySlug: (slug: string) => void;
  hasItem: (kind: CartItem["kind"], id: string) => boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStoredItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.priceCents === "number",
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStoredItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "key">) => {
    const key = cartItemKey(item.kind, item.id);
    setItems((prev) => {
      if (prev.some((existing) => existing.key === key)) return prev;
      return [...prev, { ...item, key }];
    });
    setOpen(true);
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const removeBySlug = useCallback((slug: string) => {
    setItems((prev) => prev.filter((item) => item.slug !== slug));
  }, []);

  const hasItem = useCallback(
    (kind: CartItem["kind"], id: string) =>
      items.some((item) => item.key === cartItemKey(kind, id)),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.length,
      totalCents: cartTotalCents(items),
      open,
      setOpen,
      addItem,
      removeItem,
      clear,
      removeBySlug,
      hasItem,
    }),
    [items, open, addItem, removeItem, clear, removeBySlug, hasItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
