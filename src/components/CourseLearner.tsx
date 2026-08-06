"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  canAttemptExam,
  examAttemptLabel,
  examAttemptsRemaining,
  normalizeMaxExamAttempts,
} from "@/lib/examAttempts";
import type { Course, Enrollment, ExamAnswerReview } from "@/lib/types";
import { buildQuizAnswerReview } from "@/lib/quizReview";
import { OpenExamButton } from "@/components/OpenExamButton";
import { ModuleContent } from "@/components/ModuleContent";

function QuizFeedback({ item }: { item: ExamAnswerReview }) {
  return (
    <div className="mt-3 space-y-2 border-t border-line/70 pt-3 text-sm leading-relaxed">
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
          <span className="font-semibold text-navy">Why this is correct:</span>{" "}
          {item.correctReason}
        </p>
      )}
    </div>
  );
}

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
  const wrongCount = activeReview?.filter((item) => !item.isCorrect).length || 0;

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

    const selected = quizAnswersFor(active.id) || [];
    // Always show feedback immediately from the quiz content itself.
    const localReview = buildQuizAnswerReview(active.quizQuestions, selected);
    setReviews((prev) => ({ ...prev, [active.id]: localReview }));

    const allCorrect = localReview.every((item) => item.isCorrect);
    if (!allCorrect) {
      setError(
        `${localReview.filter((i) => !i.isCorrect).length} answer${
          localReview.filter((i) => !i.isCorrect).length === 1 ? " is" : "s are"
        } incorrect. Scroll up to see the correct answers and explanations, then try again.`,
      );
      setMessage("");
      // Scroll to first wrong question feedback.
      requestAnimationFrame(() => {
        document
          .getElementById(`quiz-feedback-${active.id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
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
          quizAnswers: selected,
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

      if (Array.isArray(data.review) && data.review.length > 0) {
        setReviews((prev) => ({ ...prev, [active.id]: data.review! }));
      }

      if (!res.ok || !data.enrollment) {
        // Keep local review visible even if server rejects.
        setError(
          data.error ||
            "Some answers were incorrect. Review the feedback above and try again.",
        );
        requestAnimationFrame(() => {
          document
            .getElementById(`quiz-feedback-${active.id}`)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        return;
      }

      setCompletedIds(data.enrollment.completedModuleIds || []);
      setProgress(data.enrollment.progressPercent);
      setStatus(data.enrollment.status);
      setMessage(
        "All answers correct — progress saved. You can leave and return anytime.",
      );
      router.refresh();
    } catch {
      setError("Unable to save progress. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const maxExamAttempts = normalizeMaxExamAttempts(course.maxExamAttempts);
  const examAttemptCount = Math.max(
    0,
    Number(enrollment.examAttemptCount || 0),
  );
  const attemptsRemaining = examAttemptsRemaining(
    maxExamAttempts,
    examAttemptCount,
  );
  const attemptsOk = canAttemptExam({
    maxExamAttempts,
    examAttemptCount,
    status,
  });
  const modulesDone = progress >= 100 || status === "exam_ready";
  const examReady = modulesDone && attemptsOk;
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
            disabled={!examReady}
            label={
              examAttemptCount > 0 && attemptsOk
                ? "Retake final exam"
                : "Take final exam"
            }
            hint={
              !modulesDone
                ? "Finish every module quiz to unlock the final exam."
                : !attemptsOk &&
                    (status === "completed" || status === "exam_passed")
                  ? "Exam already passed."
                  : !attemptsOk
                    ? `No exam attempts left (${examAttemptLabel(maxExamAttempts)}).`
                    : attemptsRemaining === null
                      ? `${examAttemptLabel(maxExamAttempts)} · Attempt ${examAttemptCount + 1}`
                      : `${attemptsRemaining} of ${maxExamAttempts} attempt${
                          maxExamAttempts === 1 ? "" : "s"
                        } remaining`
            }
          />
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
              <div
                id={`quiz-feedback-${active.id}`}
                className="mt-8 space-y-4 border-t border-line pt-6"
              >
                <h3 className="font-[family-name:var(--font-display)] text-xl text-navy">
                  Module quiz
                </h3>
                <p className="text-sm text-muted">
                  Answer every question, then click check answers. You&apos;ll
                  see the correct answer and why for each question. You must get
                  them all right to continue.
                </p>

                {activeReview && activeReview.length > 0 ? (
                  <div
                    className={`rounded-sm px-3 py-2 text-sm ${
                      wrongCount > 0
                        ? "bg-red-50 text-danger"
                        : "bg-teal/10 text-navy"
                    }`}
                  >
                    {wrongCount > 0
                      ? `${wrongCount} incorrect — see the correct answers and explanations under each question below.`
                      : "All answers correct. Saving your progress…"}
                  </div>
                ) : null}

                {active.quizQuestions.map((question, qIndex) => {
                  const item =
                    activeReview?.[qIndex] ||
                    activeReview?.find((r) => r.questionId === question.id);
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
                        {question.choices.map((choice, cIndex) => {
                          const selected =
                            (answers[active.id] || [])[qIndex] === cIndex;
                          const showKey = Boolean(item);
                          const isCorrectChoice =
                            cIndex === question.correctIndex;
                          return (
                            <label
                              key={`${question.id}-${cIndex}`}
                              className={`flex cursor-pointer items-start gap-3 text-sm ${
                                showKey && isCorrectChoice
                                  ? "font-semibold text-navy"
                                  : showKey && selected && !isCorrectChoice
                                    ? "text-danger"
                                    : ""
                              }`}
                            >
                              <input
                                type="radio"
                                name={`${active.id}-${question.id}`}
                                checked={selected}
                                onChange={() => {
                                  setAnswers((prev) => {
                                    const current = [
                                      ...(prev[active.id] ||
                                        active.quizQuestions.map(() => -1)),
                                    ];
                                    current[qIndex] = cIndex;
                                    return { ...prev, [active.id]: current };
                                  });
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
                              <span>
                                {choice}
                                {showKey && isCorrectChoice
                                  ? " ✓ Correct answer"
                                  : ""}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {item ? <QuizFeedback item={item} /> : null}
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
                    <QuizFeedback item={item} />
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
