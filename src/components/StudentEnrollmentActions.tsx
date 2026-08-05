"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Course } from "@/lib/types";

export function StudentEnrollmentActions({
  enrollmentId,
  currentCourseId,
  courses,
}: {
  enrollmentId: string;
  currentCourseId: string;
  courses: Course[];
}) {
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"reset" | "reassign" | null>(null);

  async function run(action: "reset" | "reassign") {
    setBusy(action);
    setError("");
    setMessage("");

    if (action === "reassign" && !courseId) {
      setError("Choose a course to reassign.");
      setBusy(null);
      return;
    }

    if (
      action === "reset" &&
      !window.confirm(
        "Reset this student’s module progress and exam status for this course?",
      )
    ) {
      setBusy(null);
      return;
    }

    if (
      action === "reassign" &&
      !window.confirm(
        "Reassign this student to the selected course? Progress on the current enrollment will be cleared.",
      )
    ) {
      setBusy(null);
      return;
    }

    try {
      const res = await fetch("/api/staff/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          enrollmentId,
          courseId: action === "reassign" ? courseId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to update enrollment.");
        return;
      }
      setMessage(
        action === "reset"
          ? "Modules reset. Student can start fresh."
          : "Course reassigned and progress cleared.",
      );
      setCourseId("");
      router.refresh();
    } catch {
      setError("Unable to update enrollment.");
    } finally {
      setBusy(null);
    }
  }

  const otherCourses = courses.filter((c) => c.id !== currentCourseId);

  return (
    <div className="min-w-[220px] space-y-2">
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => run("reset")}
        className="btn btn-ghost !px-2.5 !py-1.5 text-xs"
      >
        {busy === "reset" ? "Resetting…" : "Reset modules"}
      </button>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="min-w-[140px] flex-1 border border-line bg-white px-2 py-1.5 text-xs"
        >
          <option value="">Reassign course…</option>
          {otherCourses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy !== null || !courseId}
          onClick={() => run("reassign")}
          className="btn btn-navy !px-2.5 !py-1.5 text-xs"
        >
          {busy === "reassign" ? "Saving…" : "Apply"}
        </button>
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      {message ? <p className="text-xs text-teal">{message}</p> : null}
    </div>
  );
}
