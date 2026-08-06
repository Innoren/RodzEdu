"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { examAttemptLabel } from "@/lib/examAttempts";
import type { Course, ExamAnswerReview } from "@/lib/types";

export function ExamClient({
  enrollmentId,
  course,
  examAttemptCount,
  maxExamAttempts,
  attemptsRemaining,
}: {
  enrollmentId: string;
  course: Course;
  examAttemptCount: number;
  maxExamAttempts: number;
  attemptsRemaining: number | null;
}) {
  const [answers, setAnswers] = useState<number[]>(
    () => course.examQuestions.map(() => -1),
  );
  const [usedAttempts, setUsedAttempts] = useState(examAttemptCount);
  const [remaining, setRemaining] = useState(attemptsRemaining);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    certificateId?: string;
    review: ExamAnswerReview[];
    attemptsRemaining: number | null;
    examAttemptCount: number;
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
    try {
      const res = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to submit exam.");
        return;
      }

      const nextUsed =
        typeof data.examAttemptCount === "number"
          ? data.examAttemptCount
          : usedAttempts + 1;
      const nextRemaining =
        typeof data.attemptsRemaining === "number"
          ? data.attemptsRemaining
          : data.attemptsRemaining === null
            ? null
            : remaining === null
              ? null
              : Math.max(0, remaining - 1);
      setUsedAttempts(nextUsed);
      setRemaining(nextRemaining);
      setResult({
        score: data.score,
        passed: data.passed,
        certificateId: data.certificate?.id || data.enrollment?.certificateId,
        review: Array.isArray(data.review) ? data.review : [],
        attemptsRemaining: nextRemaining,
        examAttemptCount: nextUsed,
      });
    } catch {
      setError("Unable to submit exam. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const canRetake =
      !result.passed &&
      (result.attemptsRemaining === null || result.attemptsRemaining > 0);
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="panel p-8 text-center">
          <p className="eyebrow">{result.passed ? "Passed" : "Not passed"}</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">
            Score: {result.score}%
          </h2>
          <p className="mt-4 text-muted">
            {result.passed
              ? "Congratulations — your certificate was issued automatically. Review your answers below, then download your certificate."
              : canRetake
                ? `A score of 75% is required to pass. Review the feedback below, study the modules again, then retake the exam. ${
                    result.attemptsRemaining === null
                      ? "Attempts are unlimited for this course."
                      : `You have ${result.attemptsRemaining} attempt${
                          result.attemptsRemaining === 1 ? "" : "s"
                        } remaining.`
                  }`
                : "A score of 75% is required to pass. You have used all exam attempts for this course. Contact your instructor or RodzEdu staff if you need another attempt."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {result.passed && result.certificateId ? (
              <Link
                href={`/student/certificates/${result.certificateId}`}
                className="btn btn-primary"
              >
                Download certificate
              </Link>
            ) : null}
            <Link href="/student" className="btn btn-navy">
              Back to my progress
            </Link>
            <Link
              href={`/student/learn/${enrollmentId}`}
              className="btn btn-ghost"
            >
              Review modules
            </Link>
            {canRetake ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setResult(null);
                  setAnswers(course.examQuestions.map(() => -1));
                  setError("");
                }}
              >
                Retake exam
              </button>
            ) : null}
          </div>
        </div>

        <section className="space-y-4">
          <h3 className="font-[family-name:var(--font-display)] text-2xl text-navy">
            Answer review
          </h3>
          {result.review.map((item, index) => (
            <article
              key={item.questionId}
              className={`panel p-5 ${
                item.isCorrect
                  ? "border-teal/40 bg-teal/5"
                  : "border-danger/30 bg-red-50/60"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                Question {index + 1} · {item.isCorrect ? "Correct" : "Incorrect"}
              </p>
              <p className="mt-2 font-semibold text-navy">{item.prompt}</p>
              <div className="mt-3 space-y-2 text-sm leading-relaxed">
                <p className="text-ink/85">
                  <span className="font-semibold text-navy">Your answer:</span>{" "}
                  {item.selectedChoice}
                </p>
                {!item.isCorrect ? (
                  <>
                    <p className="text-danger">
                      <span className="font-semibold">Why this is incorrect:</span>{" "}
                      {item.incorrectReason}
                    </p>
                    <p className="text-navy">
                      <span className="font-semibold">Correct answer:</span>{" "}
                      {item.correctChoice}
                    </p>
                    <p className="text-ink/85">
                      <span className="font-semibold">Why the correct answer is right:</span>{" "}
                      {item.correctReason}
                    </p>
                  </>
                ) : (
                  <p className="text-ink/85">
                    <span className="font-semibold text-navy">
                      Why this is correct:
                    </span>{" "}
                    {item.correctReason}
                  </p>
                )}
              </div>
            </article>
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="panel sticky top-0 z-10 mb-5 flex flex-wrap items-center justify-between gap-3 border-b-2 border-teal bg-white px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
            Final exam
          </p>
          <p className="font-[family-name:var(--font-display)] text-xl text-navy">
            {course.title}
          </p>
          <p className="mt-1 text-xs text-muted">
            {examAttemptLabel(maxExamAttempts)}
            {remaining === null
              ? ` · Attempt ${usedAttempts + 1}`
              : ` · Attempt ${usedAttempts + 1} of ${maxExamAttempts} (${remaining} left after this)`}
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
                  key={`${question.id}-${cIndex}`}
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
        <Link href={`/student/learn/${enrollmentId}`} className="btn btn-ghost">
          Exit without submitting
        </Link>
      </div>
    </div>
  );
}
