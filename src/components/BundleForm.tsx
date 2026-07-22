"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Course } from "@/lib/types";

export function BundleForm({ courses }: { courses: Course[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        price: form.get("price"),
        published: form.get("published") === "on",
        courseIds: selected,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Unable to create bundle.");
      return;
    }
    setMessage(`Bundle “${data.bundle.title}” created.`);
    setSelected([]);
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-6">
      <label className="block text-sm font-medium text-navy">
        Bundle title
        <input name="title" required className="mt-1 w-full border border-line px-3 py-2" />
      </label>
      <label className="block text-sm font-medium text-navy">
        Description
        <textarea
          name="description"
          rows={3}
          className="mt-1 w-full border border-line px-3 py-2"
        />
      </label>
      <label className="block text-sm font-medium text-navy">
        Bundle price (USD)
        <input
          name="price"
          type="number"
          min="0"
          step="0.01"
          required
          className="mt-1 w-full border border-line px-3 py-2"
        />
      </label>
      <fieldset>
        <legend className="text-sm font-medium text-navy">
          Courses in bundle (pick at least 2)
        </legend>
        <div className="mt-2 space-y-2">
          {courses.map((course) => (
            <label key={course.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(course.id)}
                onChange={(e) =>
                  setSelected((prev) =>
                    e.target.checked
                      ? [...prev, course.id]
                      : prev.filter((id) => id !== course.id),
                  )
                }
              />
              {course.title}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm text-navy">
        <input name="published" type="checkbox" defaultChecked />
        Publish to catalog
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      {message && <p className="text-sm text-teal">{message}</p>}
      <button type="submit" disabled={saving} className="btn btn-primary">
        {saving ? "Saving…" : "Create bundle"}
      </button>
    </form>
  );
}
