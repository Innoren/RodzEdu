"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Course, User } from "@/lib/types";

export function AssignCourseForm({
  students,
  courses,
}: {
  students: User[];
  courses: Course[];
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/staff/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          studentId,
          courseId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to assign course.");
        return;
      }
      setMessage("Course assigned to student.");
      setCourseId("");
      router.refresh();
    } catch {
      setError("Unable to assign course.");
    } finally {
      setSaving(false);
    }
  }

  if (students.length === 0 || courses.length === 0) {
    return null;
  }

  return (
    <form onSubmit={onSubmit} className="panel mt-6 space-y-4 p-5">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy">
          Assign a course
        </h2>
        <p className="mt-1 text-sm text-muted">
          Enroll a student in a published course. If they already have it, their
          existing enrollment is kept.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="block text-sm font-medium text-navy">
          Student
          <select
            required
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="mt-1 w-full border border-line px-3 py-2"
          >
            <option value="">Select student…</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.email})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-navy">
          Course
          <select
            required
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="mt-1 w-full border border-line px-3 py-2"
          >
            <option value="">Select course…</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? "Assigning…" : "Assign course"}
        </button>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-teal">{message}</p> : null}
    </form>
  );
}
