"use client";

import { useState } from "react";

export function ContactForm({
  defaultEmail = "",
  defaultName = "",
  courseId,
  courseTitle,
}: {
  defaultEmail?: string;
  defaultName?: string;
  courseId?: string;
  courseTitle?: string;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        subject: form.get("subject"),
        message: form.get("message"),
        courseId: courseId || form.get("courseId") || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Unable to send your message.");
      return;
    }
    setMessage("Message received. Our team will follow up during office hours.");
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {courseTitle ? (
        <p className="rounded-sm border border-teal/30 bg-teal/10 px-3 py-2 text-sm text-navy">
          Help request for: <strong>{courseTitle}</strong>
        </p>
      ) : null}
      <label className="block text-sm font-medium text-navy">
        Name
        <input
          name="name"
          required
          defaultValue={defaultName}
          className="mt-1 w-full border border-line px-3 py-2"
        />
      </label>
      <label className="block text-sm font-medium text-navy">
        Email
        <input
          name="email"
          type="email"
          required
          defaultValue={defaultEmail}
          className="mt-1 w-full border border-line px-3 py-2"
        />
      </label>
      <label className="block text-sm font-medium text-navy">
        Subject
        <input
          name="subject"
          required
          defaultValue={courseTitle ? `Help with ${courseTitle}` : ""}
          className="mt-1 w-full border border-line px-3 py-2"
        />
      </label>
      <label className="block text-sm font-medium text-navy">
        Message
        <textarea
          name="message"
          required
          rows={5}
          className="mt-1 w-full border border-line px-3 py-2"
          placeholder="How can we help?"
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      {message && <p className="text-sm text-teal">{message}</p>}
      <button type="submit" disabled={saving} className="btn btn-primary">
        {saving ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
