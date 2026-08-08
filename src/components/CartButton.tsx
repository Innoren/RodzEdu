"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatMoney } from "@/lib/format";

type DiscountPreview = {
  code: string;
  finalCents: number;
  discountCents: number;
};

export function CartButton({
  canCheckout,
  loginPath = "/login",
}: {
  canCheckout: boolean;
  loginPath?: string;
}) {
  const { items, count, totalCents, open, setOpen, removeItem } = useCart();
  const titleId = useId();
  const [discountCode, setDiscountCode] = useState("");
  const [discountPreview, setDiscountPreview] = useState<DiscountPreview | null>(
    null,
  );
  const [discountError, setDiscountError] = useState("");
  const [validating, setValidating] = useState(false);
  const [checkoutKey, setCheckoutKey] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    setDiscountPreview(null);
    setDiscountError("");
  }, [items, discountCode]);

  async function applyDiscount() {
    const code = discountCode.trim();
    if (!code) {
      setDiscountError("Enter a discount code.");
      return;
    }
    if (items.length === 0) {
      setDiscountError("Add an item before applying a code.");
      return;
    }
    setValidating(true);
    setDiscountError("");
    try {
      const response = await fetch("/api/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "validate",
          code,
          priceCents: totalCents,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setDiscountPreview(null);
        setDiscountError(data.error || "Invalid discount code.");
        return;
      }
      setDiscountPreview({
        code: data.code,
        finalCents: data.finalCents,
        discountCents: data.discountCents,
      });
    } catch {
      setDiscountError("Could not validate that code. Try again.");
    } finally {
      setValidating(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative inline-flex h-10 w-10 items-center justify-center border border-line bg-white text-navy transition hover:border-teal hover:text-teal"
        aria-label={count > 0 ? `Open cart, ${count} items` : "Open cart"}
      >
        <CartIcon />
        {count > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center bg-accent px-1 text-[11px] font-bold text-white">
            {count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-navy-deep/40 backdrop-blur-[2px]"
            aria-label="Close cart"
            onClick={() => setOpen(false)}
          />
          <aside
            className="cart-drawer relative flex h-full w-full max-w-md flex-col border-l border-line bg-[#f8fbfd] shadow-[-12px_0_40px_rgba(7,28,46,0.18)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <p className="eyebrow">Your cart</p>
                <h2
                  id={titleId}
                  className="mt-1 font-[family-name:var(--font-display)] text-2xl text-navy"
                >
                  Ready to enroll
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn btn-ghost !px-3 !py-2 text-sm"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="border border-dashed border-line bg-white px-4 py-10 text-center">
                  <p className="font-medium text-navy">Your cart is empty</p>
                  <p className="mt-2 text-sm text-muted">
                    Browse the catalog and add a course or bundle to review before
                    checkout.
                  </p>
                  <Link
                    href="/courses"
                    onClick={() => setOpen(false)}
                    className="btn btn-primary mt-5 inline-flex"
                  >
                    Browse courses
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.key}
                      className="border border-line bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                            {item.kind === "bundle" ? "Bundle" : "Course"}
                          </p>
                          <Link
                            href={
                              item.kind === "bundle"
                                ? `/bundles/${item.slug}`
                                : `/courses/${item.slug}`
                            }
                            onClick={() => setOpen(false)}
                            className="mt-1 block font-semibold text-navy hover:text-teal"
                          >
                            {item.title}
                          </Link>
                          <p className="mt-1 text-sm text-muted">{item.detail}</p>
                        </div>
                        <p className="shrink-0 text-base font-semibold text-navy">
                          {formatMoney(item.priceCents)}
                        </p>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {canCheckout ? (
                          <form
                            action="/api/checkout"
                            method="post"
                            className="flex-1"
                            onSubmit={() => setCheckoutKey(item.key)}
                          >
                            {item.kind === "course" ? (
                              <input
                                type="hidden"
                                name="courseId"
                                value={item.id}
                              />
                            ) : (
                              <input
                                type="hidden"
                                name="bundleId"
                                value={item.id}
                              />
                            )}
                            <input
                              type="hidden"
                              name="discountCode"
                              value={discountPreview?.code || discountCode}
                            />
                            <button
                              type="submit"
                              className="btn btn-primary w-full !py-2 text-sm"
                              disabled={checkoutKey === item.key}
                            >
                              {checkoutKey === item.key
                                ? "Redirecting…"
                                : "Checkout"}
                            </button>
                          </form>
                        ) : (
                          <Link
                            href={`${loginPath}?next=${encodeURIComponent(
                              item.kind === "bundle"
                                ? `/bundles/${item.slug}`
                                : `/courses/${item.slug}`,
                            )}`}
                            onClick={() => setOpen(false)}
                            className="btn btn-primary flex-1 !py-2 text-center text-sm"
                          >
                            Sign in to checkout
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="btn btn-ghost !px-3 !py-2 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 ? (
              <div className="border-t border-line bg-white px-5 py-4">
                <label className="block text-sm font-medium text-navy">
                  Discount code
                  <div className="mt-1 flex gap-2">
                    <input
                      value={discountCode}
                      onChange={(event) =>
                        setDiscountCode(event.target.value.toUpperCase())
                      }
                      placeholder="WELCOME10"
                      autoComplete="off"
                      className="min-w-0 flex-1 border border-line px-3 py-2 uppercase tracking-wide"
                    />
                    <button
                      type="button"
                      onClick={applyDiscount}
                      disabled={validating}
                      className="btn btn-ghost !px-3 !py-2 text-sm"
                    >
                      {validating ? "…" : "Apply"}
                    </button>
                  </div>
                </label>
                {discountError ? (
                  <p className="mt-2 text-sm text-danger">{discountError}</p>
                ) : null}
                {discountPreview ? (
                  <p className="mt-2 text-sm text-success">
                    Code {discountPreview.code} saves{" "}
                    {formatMoney(discountPreview.discountCents)}.
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted">
                    Optional — apply a code before checking out an item.
                  </p>
                )}

                <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-4">
                  <div>
                    <p className="text-sm text-muted">
                      {count} {count === 1 ? "item" : "items"}
                    </p>
                    <p className="text-lg font-semibold text-navy">
                      {discountPreview
                        ? formatMoney(discountPreview.finalCents)
                        : formatMoney(totalCents)}
                    </p>
                    {discountPreview ? (
                      <p className="text-xs text-muted line-through">
                        {formatMoney(totalCents)}
                      </p>
                    ) : null}
                  </div>
                  <p className="max-w-[12rem] text-right text-xs text-muted">
                    Checkout each item to enroll. Discount applies at payment.
                  </p>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </>
  );
}

function CartIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3.5 5h1.6l1.2 11.2a1.5 1.5 0 0 0 1.5 1.3h9.4a1.5 1.5 0 0 0 1.5-1.2L20.5 8H7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="19.5" r="1.2" fill="currentColor" />
      <circle cx="16.5" cy="19.5" r="1.2" fill="currentColor" />
    </svg>
  );
}
