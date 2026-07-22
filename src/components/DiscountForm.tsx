"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DiscountForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.get("code"),
        percentOff: form.get("percentOff") || undefined,
        amountOff: form.get("amountOff") || undefined,
        maxRedemptions: form.get("maxRedemptions") || undefined,
        expiresAt: form.get("expiresAt") || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Unable to create discount code.");
      return;
    }
    setMessage(`Code ${data.discountCode.code} is ready.`);
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-6">
      <label className="block text-sm font-medium text-navy">
        Code
        <input
          name="code"
          required
          placeholder="WELCOME10"
          className="mt-1 w-full border border-line px-3 py-2 uppercase"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-navy">
          Percent off
          <input
            name="percentOff"
            type="number"
            min="1"
            max="100"
            placeholder="10"
            className="mt-1 w-full border border-line px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Or amount off (USD)
          <input
            name="amountOff"
            type="number"
            min="0"
            step="0.01"
            placeholder="5.00"
            className="mt-1 w-full border border-line px-3 py-2"
          />
        </label>
      </div>
      <label className="block text-sm font-medium text-navy">
        Max redemptions (optional)
        <input
          name="maxRedemptions"
          type="number"
          min="1"
          className="mt-1 w-full border border-line px-3 py-2"
        />
      </label>
      <label className="block text-sm font-medium text-navy">
        Expires (optional)
        <input
          name="expiresAt"
          type="date"
          className="mt-1 w-full border border-line px-3 py-2"
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      {message && <p className="text-sm text-teal">{message}</p>}
      <button type="submit" disabled={saving} className="btn btn-primary">
        {saving ? "Saving…" : "Create discount code"}
      </button>
    </form>
  );
}
