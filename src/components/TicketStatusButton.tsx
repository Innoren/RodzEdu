"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SupportTicketStatus } from "@/lib/types";

export function TicketStatusButton({
  ticketId,
  status,
}: {
  ticketId: string;
  status: SupportTicketStatus;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function update(next: SupportTicketStatus) {
    setSaving(true);
    await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateStatus", id: ticketId, status: next }),
    });
    setSaving(false);
    router.refresh();
  }

  if (status === "resolved") {
    return <span className="text-sm text-success">Resolved</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "open" ? (
        <button
          type="button"
          disabled={saving}
          onClick={() => update("in_progress")}
          className="btn btn-ghost !px-3 !py-1.5 text-xs"
        >
          Mark in progress
        </button>
      ) : null}
      <button
        type="button"
        disabled={saving}
        onClick={() => update("resolved")}
        className="btn btn-navy !px-3 !py-1.5 text-xs"
      >
        Resolve
      </button>
    </div>
  );
}
