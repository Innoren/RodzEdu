export type CartItem = {
  key: string;
  kind: "course" | "bundle";
  id: string;
  title: string;
  slug: string;
  priceCents: number;
  detail: string;
};

export function cartItemKey(kind: CartItem["kind"], id: string): string {
  return `${kind}:${id}`;
}

export function cartTotalCents(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.priceCents, 0);
}
