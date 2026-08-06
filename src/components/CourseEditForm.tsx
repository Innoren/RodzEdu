"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  DEFAULT_MAX_EXAM_ATTEMPTS,
  EXAM_ATTEMPT_OPTIONS,
  normalizeMaxExamAttempts,
} from "@/lib/examAttempts";
import { parseExamBulk } from "@/lib/parseExamBulk";
import type { Course } from "@/lib/types";

type QuestionDraft = {
  prompt: string;
  choices: string;
  correctIndex: number;
  explanation?: string;
};

export function CourseEditForm({ course }: { course: Course }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [bulkNotice, setBulkNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    course.examQuestions.map((q) => ({
      prompt: q.prompt,
      choices: q.choices.join("\n"),
      correctIndex: q.correctIndex,
      explanation: q.explanation,
    })),
  );

  function applyBulk(raw: string, mode: "replace" | "append") {
    const result = parseExamBulk(raw);
    if (result.error) {
      setBulkNotice("");
      setError(result.error);
      return;
    }
    setError("");
    setQuestions((prev) =>
      mode === "append" ? [...prev, ...result.questions] : result.questions,
    );
    setBulkNotice(
      `Loaded ${result.questions.length} question${
        result.questions.length === 1 ? "" : "s"
      }.`,
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const examQuestions = questions.map((q) => ({
      prompt: q.prompt,
      choices: q.choices
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      correctIndex: q.correctIndex,
      explanation: q.explanation,
    }));

    if (
      examQuestions.length === 0 ||
      examQuestions.some((q) => !q.prompt || q.choices.length < 2)
    ) {
      setError("Keep at least one complete exam question with choices.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          category: form.get("category"),
          credits: Number(form.get("credits")),
          price: Number(form.get("price")),
          description: form.get("description"),
          content: form.get("content"),
          published: form.get("published") === "on",
          featured: form.get("featured") === "on",
          maxExamAttempts: normalizeMaxExamAttempts(
            form.get("maxExamAttempts"),
          ),
          examQuestions,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to save course.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Unable to save course.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-6">
      {error ? (
        <p className="rounded-sm bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <p className="rounded-sm border border-line bg-sand/40 px-3 py-2 text-sm text-muted">
        This course has{" "}
        <strong className="text-navy">{course.modules?.length || 0} modules</strong>
        . Module lesson content is preserved when you save metadata and exam
        updates here.
      </p>

      <label className="block text-sm font-medium text-navy">
        Course title
        <input
          name="title"
          required
          defaultValue={course.title}
          className="mt-1 w-full border border-line px-3 py-2"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm font-medium text-navy">
          Category
          <input
            name="category"
            defaultValue={course.category}
            className="mt-1 w-full border border-line px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          CE credits
          <input
            name="credits"
            type="number"
            min={1}
            defaultValue={course.credits}
            className="mt-1 w-full border border-line px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Price (USD)
          <input
            name="price"
            type="number"
            min={0}
            step="0.01"
            defaultValue={(course.priceCents / 100).toFixed(2)}
            className="mt-1 w-full border border-line px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Final exam attempts
          <select
            name="maxExamAttempts"
            defaultValue={String(
              normalizeMaxExamAttempts(
                course.maxExamAttempts ?? DEFAULT_MAX_EXAM_ATTEMPTS,
              ),
            )}
            className="mt-1 w-full border border-line px-3 py-2"
          >
            {EXAM_ATTEMPT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm font-medium text-navy">
        Short description
        <textarea
          name="description"
          required
          rows={3}
          defaultValue={course.description}
          className="mt-1 w-full border border-line px-3 py-2"
        />
      </label>

      <label className="block text-sm font-medium text-navy">
        Course overview text
        <textarea
          name="content"
          required
          rows={5}
          defaultValue={course.content}
          className="mt-1 w-full border border-line px-3 py-2"
        />
      </label>

      <div className="border border-teal/30 bg-teal/5 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-navy">
              Replace / append exam questions
            </p>
            <p className="mt-1 text-sm text-muted">
              Paste a question bank or upload a .txt / .csv file.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost !px-3 !py-2 text-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload .txt / .csv
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv,text/plain,text/csv"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              applyBulk(await file.text(), "replace");
            }}
          />
        </div>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={6}
          className="mt-4 w-full border border-line bg-white px-3 py-2 font-mono text-xs"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-navy !px-3 !py-2 text-sm"
            onClick={() => applyBulk(bulkText, "replace")}
          >
            Replace questions from bulk
          </button>
          <button
            type="button"
            className="btn btn-ghost !px-3 !py-2 text-sm"
            onClick={() => applyBulk(bulkText, "append")}
          >
            Append to existing
          </button>
        </div>
        {bulkNotice ? (
          <p className="mt-3 text-sm font-medium text-teal">{bulkNotice}</p>
        ) : null}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-navy">
            Exam questions ({questions.length})
          </p>
          <button
            type="button"
            className="text-sm font-semibold text-teal"
            onClick={() =>
              setQuestions((prev) => [
                ...prev,
                {
                  prompt: "",
                  choices: "Option A\nOption B\nOption C\nOption D",
                  correctIndex: 0,
                },
              ])
            }
          >
            + Add question
          </button>
        </div>
        <div className="mt-3 max-h-[480px] space-y-4 overflow-y-auto pr-1">
          {questions.map((q, index) => (
            <div key={index} className="border border-line p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-navy">
                  Question {index + 1}
                </p>
                {questions.length > 1 ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-danger"
                    onClick={() =>
                      setQuestions((prev) =>
                        prev.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <label className="mt-2 block text-sm font-medium text-navy">
                Prompt
                <input
                  value={q.prompt}
                  onChange={(e) =>
                    setQuestions((prev) =>
                      prev.map((item, i) =>
                        i === index ? { ...item, prompt: e.target.value } : item,
                      ),
                    )
                  }
                  required
                  className="mt-1 w-full border border-line px-3 py-2"
                />
              </label>
              <label className="mt-3 block text-sm font-medium text-navy">
                Choices (one per line)
                <textarea
                  value={q.choices}
                  onChange={(e) =>
                    setQuestions((prev) =>
                      prev.map((item, i) =>
                        i === index
                          ? { ...item, choices: e.target.value }
                          : item,
                      ),
                    )
                  }
                  rows={4}
                  required
                  className="mt-1 w-full border border-line px-3 py-2"
                />
              </label>
              <label className="mt-3 block text-sm font-medium text-navy">
                Correct choice
                <select
                  value={q.correctIndex}
                  onChange={(e) =>
                    setQuestions((prev) =>
                      prev.map((item, i) =>
                        i === index
                          ? { ...item, correctIndex: Number(e.target.value) }
                          : item,
                      ),
                    )
                  }
                  className="mt-1 w-full border border-line px-3 py-2"
                >
                  {q.choices
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((choice, choiceIndex) => (
                      <option key={choiceIndex} value={choiceIndex}>
                        {String.fromCharCode(65 + choiceIndex)}. {choice}
                      </option>
                    ))}
                </select>
              </label>
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-navy">
        <input
          type="checkbox"
          name="published"
          defaultChecked={course.published}
        />
        Published in catalog
      </label>
      <label className="flex items-center gap-2 text-sm text-navy">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={course.featured}
        />
        Featured on homepage and catalog
      </label>

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => router.push("/admin")}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
