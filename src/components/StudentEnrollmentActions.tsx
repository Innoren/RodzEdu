"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Course } from "@/lib/types";

type ModuleOption = { id: string; title: string };

export function StudentEnrollmentActions({
  enrollmentId,
  currentCourseId,
  courses,
  modules,
  compactMobile = false,
}: {
  enrollmentId: string;
  currentCourseId: string;
  courses: Course[];
  modules: ModuleOption[];
  /** Stretch controls to full width inside mobile cards only. */
  compactMobile?: boolean;
}) {
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [moduleNumber, setModuleNumber] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<
    "reset" | "reassign" | "advance" | "unlock_exam" | "unenroll" | null
  >(null);

  async function post(body: Record<string, unknown>) {
    const res = await fetch("/api/staff/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Unable to update enrollment.");
    }
    return data;
  }

  async function runReset() {
    setBusy("reset");
    setError("");
    setMessage("");
    if (
      !window.confirm(
        "Reset this student’s module progress and exam status for this course?",
      )
    ) {
      setBusy(null);
      return;
    }
    try {
      await post({ action: "reset", enrollmentId });
      setMessage("Modules reset. Student can start fresh.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update enrollment.");
    } finally {
      setBusy(null);
    }
  }

  async function runReassign() {
    setBusy("reassign");
    setError("");
    setMessage("");
    if (!courseId) {
      setError("Choose a course to reassign.");
      setBusy(null);
      return;
    }
    if (
      !window.confirm(
        "Reassign this student to the selected course? Progress on the current enrollment will be cleared.",
      )
    ) {
      setBusy(null);
      return;
    }
    try {
      await post({ action: "reassign", enrollmentId, courseId });
      setMessage("Course reassigned and progress cleared.");
      setCourseId("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update enrollment.");
    } finally {
      setBusy(null);
    }
  }

  async function runAdvance() {
    setBusy("advance");
    setError("");
    setMessage("");
    if (!moduleNumber) {
      setError("Choose a module to jump to.");
      setBusy(null);
      return;
    }
    const label =
      modules[Number(moduleNumber) - 1]?.title || `Module ${moduleNumber}`;
    if (
      !window.confirm(
        `Fast-forward this student to “${label}”? Earlier modules will be marked complete (quizzes skipped).`,
      )
    ) {
      setBusy(null);
      return;
    }
    try {
      await post({
        action: "advance",
        enrollmentId,
        resumeAtModuleNumber: Number(moduleNumber),
      });
      setMessage(`Student placed on ${label}.`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update enrollment.");
    } finally {
      setBusy(null);
    }
  }

  async function runUnlockExam() {
    setBusy("unlock_exam");
    setError("");
    setMessage("");
    if (
      !window.confirm(
        "Unlock the final exam for this student? All modules will be marked complete (quizzes skipped).",
      )
    ) {
      setBusy(null);
      return;
    }
    try {
      await post({ action: "unlock_exam", enrollmentId });
      setMessage("Final exam unlocked. Student can take the exam now.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update enrollment.");
    } finally {
      setBusy(null);
    }
  }

  async function runUnenroll() {
    setBusy("unenroll");
    setError("");
    setMessage("");
    if (
      !window.confirm(
        "Unenroll this student from the course? They will lose access, progress, and any certificate for this enrollment.",
      )
    ) {
      setBusy(null);
      return;
    }
    try {
      await post({ action: "unenroll", enrollmentId });
      setMessage("Student unenrolled.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to unenroll student.");
    } finally {
      setBusy(null);
    }
  }

  const otherCourses = courses.filter((c) => c.id !== currentCourseId);
  const disabled = busy !== null;
  const full = compactMobile ? "w-full" : "";

  return (
    <div className={`space-y-2 ${compactMobile ? "min-w-0" : "min-w-[240px]"}`}>
      <div className={`flex flex-wrap items-center gap-2 ${compactMobile ? "flex-col" : ""}`}>
        <select
          value={moduleNumber}
          onChange={(e) => setModuleNumber(e.target.value)}
          className={`flex-1 border border-line bg-white px-2 py-1.5 text-xs ${
            compactMobile ? "w-full min-w-0" : "min-w-[160px]"
          }`}
        >
          <option value="">Jump to module…</option>
          {modules.map((module, index) => (
            <option key={module.id} value={String(index + 1)}>
              {index + 1}. {module.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={disabled || !moduleNumber}
          onClick={runAdvance}
          className={`btn btn-navy !px-2.5 !py-1.5 text-xs ${full}`}
        >
          {busy === "advance" ? "Updating…" : "Go"}
        </button>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={runUnlockExam}
        className={`btn btn-primary !px-2.5 !py-1.5 text-xs ${full}`}
      >
        {busy === "unlock_exam" ? "Unlocking…" : "Unlock final exam"}
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={runReset}
        className={`btn btn-ghost !px-2.5 !py-1.5 text-xs ${full}`}
      >
        {busy === "reset" ? "Resetting…" : "Reset modules"}
      </button>

      <div className={`flex flex-wrap items-center gap-2 ${compactMobile ? "flex-col" : ""}`}>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className={`flex-1 border border-line bg-white px-2 py-1.5 text-xs ${
            compactMobile ? "w-full min-w-0" : "min-w-[140px]"
          }`}
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
          disabled={disabled || !courseId}
          onClick={runReassign}
          className={`btn btn-ghost !px-2.5 !py-1.5 text-xs ${full}`}
        >
          {busy === "reassign" ? "Saving…" : "Apply"}
        </button>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={runUnenroll}
        className={`btn btn-ghost !px-2.5 !py-1.5 text-xs text-danger ${full}`}
      >
        {busy === "unenroll" ? "Removing…" : "Unenroll student"}
      </button>

      {error ? <p className="text-xs text-danger">{error}</p> : null}
      {message ? <p className="text-xs text-teal">{message}</p> : null}
    </div>
  );
}
