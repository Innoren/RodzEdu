"use client";

import { useMemo, useState } from "react";
import type { Course } from "@/lib/types";

export function ExamClient({
  enrollmentId,
  course,
}: {
  enrollmentId: string;
  course: Course;
}) {
  const [answers, setAnswers] = useState<number[]>(
    () => course.examQuestions.map(() => -1),
  );
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
  } | null>(null);
  const [error, setError] = useState("");

  const answeredCount = useMemo(
    () => answers.filter((a) => a >= 0).length,
    [answers],
  );

  async function submitExam() {
    if (answeredCount < course.examQuestions.length) {
      setError("Answer every question before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");
    const res = await fetch("/api/exam/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollmentId, answers }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Unable to submit exam.");
      return;
    }

    setResult({ score: data.score, passed: data.passed });
  }

  if (result) {
    return (
      <div className="panel mx-auto max-w-xl p-8 text-center">
        <p className="eyebrow">{result.passed ? "Passed" : "Not passed"}</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">
          Score: {result.score}%
        </h2>
        <p className="mt-4 text-muted">
          {result.passed
            ? "Congratulations — your continuing education exam is complete. You may close this window and return to your student portal."
            : "A score of 75% is required to pass. Review the course modules, then retake the exam from your portal."}
        </p>
        <button
          type="button"
          onClick={() => window.close()}
          className="btn btn-navy mt-6"
        >
          Close exam window
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="panel sticky top-0 z-10 mb-5 flex flex-wrap items-center justify-between gap-3 border-b-2 border-teal bg-white px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
            Secure exam window
          </p>
          <p className="font-[family-name:var(--font-display)] text-xl text-navy">
            {course.title}
          </p>
        </div>
        <p className="exam-timer text-sm font-semibold text-navy">
          Answered {answeredCount}/{course.examQuestions.length}
        </p>
      </div>

      <div className="space-y-4">
        {course.examQuestions.map((question, qIndex) => (
          <fieldset key={question.id} className="panel p-5">
            <legend className="px-1 text-base font-semibold text-navy">
              {qIndex + 1}. {question.prompt}
            </legend>
            <div className="mt-3 space-y-2">
              {question.choices.map((choice, cIndex) => (
                <label
                  key={choice}
                  className="flex cursor-pointer items-start gap-3 rounded-sm border border-transparent px-2 py-2 hover:border-line hover:bg-sand/50"
                >
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    checked={answers[qIndex] === cIndex}
                    onChange={() =>
                      setAnswers((prev) =>
                        prev.map((value, i) =>
                          i === qIndex ? cIndex : value,
                        ),
                      )
                    }
                    className="mt-1"
                  />
                  <span className="text-sm text-ink/90">{choice}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-sm bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={submitExam}
          disabled={submitting}
          className="btn btn-primary"
        >
          {submitting ? "Submitting…" : "Submit exam"}
        </button>
        <button
          type="button"
          onClick={() => window.close()}
          className="btn btn-ghost"
        >
          Exit without submitting
        </button>
      </div>
    </div>
  );
}
