"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UpdateProgressButton({
  enrollmentId,
  current,
}: {
  enrollmentId: string;
  current: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const next = Math.min(100, current + 20);

  async function advance() {
    setLoading(true);
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollmentId, progressPercent: next }),
    });
    router.refresh();
    setLoading(false);
  }

  if (current >= 100) {
    return (
      <span className="text-sm font-semibold text-success">Modules complete</span>
    );
  }

  return (
    <button
      type="button"
      onClick={advance}
      disabled={loading}
      className="btn btn-ghost !px-3 !py-2 text-sm"
    >
      {loading ? "Saving…" : `Mark +20% progress (${next}%)`}
    </button>
  );
}
