"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InstructorForm() {
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Unable to create instructor.");
      return;
    }
    setMessage(`Instructor ${data.instructor.name} added.`);
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-6">
      <label className="block text-sm font-medium text-navy">
        Full name
        <input name="name" required className="mt-1 w-full border border-line px-3 py-2" />
      </label>
      <label className="block text-sm font-medium text-navy">
        Email
        <input
          name="email"
          type="email"
          required
          className="mt-1 w-full border border-line px-3 py-2"
        />
      </label>
      <label className="block text-sm font-medium text-navy">
        Temporary password
        <input
          name="password"
          type="text"
          required
          minLength={6}
          className="mt-1 w-full border border-line px-3 py-2"
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      {message && <p className="text-sm text-teal">{message}</p>}
      <button type="submit" disabled={saving} className="btn btn-primary">
        {saving ? "Adding…" : "Add instructor"}
      </button>
    </form>
  );
}
