"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { User } from "@/lib/types";

export function InstructorProfileForm({ instructor }: { instructor: User }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/instructors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: instructor.id,
        name: form.get("name"),
        credentials: form.get("credentials"),
        bio: form.get("bio"),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Unable to update instructor.");
      return;
    }
    setMessage("Profile updated.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3 border-t border-line pt-4">
      <label className="block text-sm font-medium text-navy">
        Public name
        <input
          name="name"
          required
          defaultValue={instructor.name}
          className="mt-1 w-full border border-line px-3 py-2"
        />
      </label>
      <label className="block text-sm font-medium text-navy">
        Credentials
        <input
          name="credentials"
          defaultValue={instructor.credentials || ""}
          placeholder="RT(R)(M), BS"
          className="mt-1 w-full border border-line px-3 py-2"
        />
      </label>
      <label className="block text-sm font-medium text-navy">
        Bio
        <textarea
          name="bio"
          rows={3}
          defaultValue={instructor.bio || ""}
          className="mt-1 w-full border border-line px-3 py-2"
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      {message && <p className="text-sm text-teal">{message}</p>}
      <button type="submit" disabled={saving} className="btn btn-ghost !px-3 !py-2 text-sm">
        {saving ? "Saving…" : "Save public profile"}
      </button>
    </form>
  );
}
