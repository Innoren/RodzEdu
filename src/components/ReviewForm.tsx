"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, rating, comment }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Unable to save review.");
      return;
    }
    setMessage("Thanks — your review was saved.");
    setComment("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3 border-t border-line pt-6">
      <h3 className="font-[family-name:var(--font-display)] text-xl text-navy">
        Leave a review
      </h3>
      <label className="block text-sm font-medium text-navy">
        Rating
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="mt-1 w-full border border-line px-3 py-2 md:w-40"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n === 1 ? "" : "s"}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-navy">
        Comment
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          required
          className="mt-1 w-full border border-line px-3 py-2"
          placeholder="What helped you most?"
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      {message && <p className="text-sm text-teal">{message}</p>}
      <button type="submit" disabled={saving} className="btn btn-primary !px-4 !py-2 text-sm">
        {saving ? "Saving…" : "Submit review"}
      </button>
    </form>
  );
}
