"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CourseDeleteButton({
  courseId,
  courseTitle,
}: {
  courseId: string;
  courseTitle: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onDelete() {
    if (
      !window.confirm(
        `Delete “${courseTitle}”? This also removes enrollments, certificates, and reviews for this course.`,
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to delete course.");
        return;
      }
      router.refresh();
    } catch {
      setError("Unable to delete course.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={busy}
        onClick={onDelete}
        className="btn btn-ghost !px-3 !py-2 text-sm text-danger"
      >
        {busy ? "Deleting…" : "Remove"}
      </button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
