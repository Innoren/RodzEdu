"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Course, Enrollment, ExamAnswerReview } from "@/lib/types";
import { OpenExamButton } from "@/components/OpenExamButton";
import { ModuleContent } from "@/components/ModuleContent";

export function CourseLearner({
  course,
  enrollment,
}: {
  course: Course;
  enrollment: Enrollment;
}) {
  const router = useRouter();
  const [activeId, setActiveId] = useState(
    course.modules.find(
      (m) => !enrollment.completedModuleIds.includes(m.id),
    )?.id || course.modules[0]?.id,
  );
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [reviews, setReviews] = useState<Record<string, ExamAnswerReview[]>>(
    {},
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [completedIds, setCompletedIds] = useState(
    enrollment.completedModuleIds || [],
  );
  const [progress, setProgress] = useState(enrollment.progressPercent);
  const [status, setStatus] = useState(enrollment.status);

  const active = useMemo(
    () => course.modules.find((m) => m.id === activeId),
    [activeId, course.modules],
  );

  const activeReview = activeId ? reviews[activeId] : undefined;

  function quizAnswersFor(moduleId: string): number[] | undefined {
    return answers[moduleId];
  }

  function validateQuiz(module: Course["modules"][number]): string | null {
    if (module.quizQuestions.length === 0) return null;
    const current = quizAnswersFor(module.id);
    if (!current || current.length !== module.quizQuestions.length) {
      return "Answer every quiz question before completing this module.";
    }
    if (current.some((value) => value < 0)) {
      return "Answer every quiz question before completing this module.";
    }
    return null;
  }

  async function completeActive() {
    if (!active) return;
    if (completedIds.includes(active.id)) {
      const next = course.modules.find((m) => !completedIds.includes(m.id));
      if (next) setActiveId(next.id);
      return;
    }

    const validationError = validateQuiz(active);
    if (validationError) {
      setError(validationError);
      setMessage("");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/modules/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId: enrollment.id,
          moduleId: active.id,
          quizAnswers: quizAnswersFor(active.id) || [],
        }),
      });

      let data: {
        error?: string;
        enrollment?: Enrollment;
        review?: ExamAnswerReview[];
      } = {};
      try {
        data = await res.json();
      } catch {
        setError("Unable to save progress. Please try again.");
        return;
      }

      if (Array.isArray(data.review)) {
        setReviews((prev) => ({ ...prev, [active.id]: data.review! }));
      }

      if (!res.ok || !data.enrollment) {
        setError(
          data.error ||
            "One or more quiz answers were incorrect. Review the feedback and try again.",
        );
        return;
      }

      setCompletedIds(data.enrollment.completedModuleIds || []);
      setProgress(data.enrollment.progressPercent);
      setStatus(data.enrollment.status);
      setMessage(
        "All answers correct — progress saved. You can leave and return anytime.",
      );
      router.refresh();

      const next = course.modules.find(
        (m) => !data.enrollment!.completedModuleIds.includes(m.id),
      );
      if (next) {
        // Keep review visible briefly; advance after a short moment is nicer
        // but user asked to see feedback — stay on module when they just passed
        // only auto-advance if they click continue. Don't auto-skip past review.
      }
    } catch {
      setError("Unable to save progress. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const examReady = progress >= 100 || status === "exam_ready";
  const activeDone = active ? completedIds.includes(active.id) : false;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="panel h-fit p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
          Modules
        </p>
        <p className="mt-2 text-sm text-muted">{progress}% complete</p>
        <div className="progress-track mt-2">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <nav className="mt-4 flex flex-col gap-1">
          {course.modules.map((module, index) => {
            const done = completedIds.includes(module.id);
            return (
              <button
                key={module.id}
                type="button"
                onClick={() => {
                  setActiveId(module.id);
                  setError("");
                  setMessage("");
                }}
                className={`rounded-sm px-3 py-2 text-left text-sm ${
                  activeId === module.id
                    ? "bg-sand font-semibold text-navy ring-1 ring-line"
                    : "text-ink/80 hover:bg-sand/70"
                }`}
              >
                {index + 1}. {module.title}
                {done ? " ✓" : ""}
              </button>
            );
          })}
        </nav>
        <div className="mt-5">
          <OpenExamButton
            enrollmentId={enrollment.id}
            disabled={!examReady && status !== "completed"}
          />
          {!examReady && status !== "completed" && (
            <p className="mt-2 text-xs text-muted">
              Finish every module quiz to unlock the final exam.
            </p>
          )}
        </div>
      </aside>

      <div className="panel p-6">
        {active ? (
          <>
            <p className="eyebrow">Learning module</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-navy">
              {active.title}
            </h2>
            {activeDone ? (
              <p className="mt-3 rounded-sm bg-teal/10 px-3 py-2 text-sm text-navy">
                This module is complete.
              </p>
            ) : null}
            <div className="mt-5">
              <ModuleContent content={active.content} />
            </div>

            {active.quizQuestions.length > 0 && !activeDone && (
              <div className="mt-8 space-y-4 border-t border-line pt-6">
                <h3 className="font-[family-name:var(--font-display)] text-xl text-navy">
                  Module quiz
                </h3>
                <p className="text-sm text-muted">
                  Answer every question, then check your answers. You&apos;ll
                  see why each choice is right or wrong — and you must get them
                  all correct to continue.
                </p>
                {active.quizQuestions.map((question, qIndex) => {
                  const item = activeReview?.find(
                    (r) => r.questionId === question.id,
                  );
                  return (
                    <fieldset
                      key={question.id}
                      className={`rounded-sm border p-4 ${
                        item
                          ? item.isCorrect
                            ? "border-teal/40 bg-teal/5"
                            : "border-danger/30 bg-red-50/60"
                          : "border-line"
                      }`}
                    >
                      <legend className="px-1 text-sm font-semibold text-navy">
                        {qIndex + 1}. {question.prompt}
                        {item ? (
                          <span
                            className={`ml-2 text-xs font-semibold uppercase tracking-[0.08em] ${
                              item.isCorrect ? "text-teal" : "text-danger"
                            }`}
                          >
                            {item.isCorrect ? "Correct" : "Incorrect"}
                          </span>
                        ) : null}
                      </legend>
                      <div className="mt-2 space-y-2">
                        {question.choices.map((choice, cIndex) => (
                          <label
                            key={`${question.id}-${cIndex}`}
                            className="flex cursor-pointer items-start gap-3 text-sm"
                          >
                            <input
                              type="radio"
                              name={`${active.id}-${question.id}`}
                              checked={
                                (answers[active.id] || [])[qIndex] === cIndex
                              }
                              onChange={() => {
                                setAnswers((prev) => {
                                  const current = [
                                    ...(prev[active.id] ||
                                      active.quizQuestions.map(() => -1)),
                                  ];
                                  current[qIndex] = cIndex;
                                  return { ...prev, [active.id]: current };
                                });
                                // Clear prior review when changing an answer.
                                setReviews((prev) => {
                                  if (!prev[active.id]) return prev;
                                  const next = { ...prev };
                                  delete next[active.id];
                                  return next;
                                });
                                setError("");
                                setMessage("");
                              }}
                              className="mt-1"
                            />
                            <span>{choice}</span>
                          </label>
                        ))}
                      </div>
                      {item ? (
                        <div className="mt-3 space-y-2 border-t border-line/70 pt-3 text-sm leading-relaxed">
                          <p className="text-ink/85">
                            <span className="font-semibold text-navy">
                              Your answer:
                            </span>{" "}
                            {item.selectedChoice}
                          </p>
                          {!item.isCorrect ? (
                            <>
                              <p className="text-danger">
                                <span className="font-semibold">
                                  Why this is incorrect:
                                </span>{" "}
                                {item.incorrectReason}
                              </p>
                              <p className="text-navy">
                                <span className="font-semibold">
                                  Correct answer:
                                </span>{" "}
                                {item.correctChoice}
                              </p>
                              <p className="text-ink/85">
                                <span className="font-semibold">
                                  Why the correct answer is right:
                                </span>{" "}
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
                      ) : null}
                    </fieldset>
                  );
                })}
              </div>
            )}

            {activeDone && activeReview && activeReview.length > 0 ? (
              <div className="mt-8 space-y-3 border-t border-line pt-6">
                <h3 className="font-[family-name:var(--font-display)] text-xl text-navy">
                  Quiz review
                </h3>
                {activeReview.map((item, index) => (
                  <article
                    key={item.questionId}
                    className="rounded-sm border border-teal/40 bg-teal/5 p-4 text-sm"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                      Question {index + 1} · Correct
                    </p>
                    <p className="mt-1 font-semibold text-navy">{item.prompt}</p>
                    <p className="mt-2 text-ink/85">
                      <span className="font-semibold text-navy">Answer:</span>{" "}
                      {item.correctChoice}
                    </p>
                    <p className="mt-1 text-ink/85">
                      <span className="font-semibold text-navy">Why:</span>{" "}
                      {item.correctReason}
                    </p>
                  </article>
                ))}
              </div>
            ) : null}

            {error && (
              <p className="mt-4 rounded-sm bg-red-50 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            {message && (
              <p className="mt-4 rounded-sm bg-teal/10 px-3 py-2 text-sm text-navy">
                {message}
              </p>
            )}

            <button
              type="button"
              onClick={completeActive}
              disabled={saving}
              className="btn btn-primary mt-6"
            >
              {activeDone
                ? "Continue to next module"
                : saving
                  ? "Checking…"
                  : "Check answers & complete module"}
            </button>
          </>
        ) : (
          <p className="text-muted">No modules available for this course.</p>
        )}
      </div>
    </div>
  );
}
