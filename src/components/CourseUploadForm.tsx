"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { parseExamBulk } from "@/lib/parseExamBulk";

type QuestionDraft = {
  prompt: string;
  choices: string;
  correctIndex: number;
};

const BULK_PLACEHOLDER = `Q: Increasing kVp primarily affects which image quality factor?
A) Spatial resolution
B) Subject contrast *
C) Motion blur
D) Focal spot size

Q: Collimation is used to:
A) Increase patient dose
B) Reduce scatter and improve contrast *
C) Increase focal spot blur
D) Eliminate the need for grids

Q: ALARA stands for:
A) As Low As Reasonably Achievable
B) Average Level And Radiation Allowance
C) Automated Low Area Risk Assessment
D) Applied Linear Attenuation Rating Average
Answer: A`;

export function CourseUploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [bulkNotice, setBulkNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    {
      prompt: "",
      choices: "Option A\nOption B\nOption C\nOption D",
      correctIndex: 0,
    },
  ]);

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
      } with answers${mode === "append" ? " (appended)" : ""}.`,
    );
  }

  async function onFileSelected(file: File | null) {
    if (!file) return;
    const text = await file.text();
    setBulkText(text);
    applyBulk(text, "replace");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const content = String(form.get("content") || "");
    const payload = {
      title: form.get("title"),
      category: form.get("category"),
      credits: Number(form.get("credits")),
      price: Number(form.get("price")),
      description: form.get("description"),
      content,
      published: form.get("published") === "on",
      featured: form.get("featured") === "on",
      modules: [
        {
          title: "Module 1 — Foundations",
          content,
          quizQuestions: [
            {
              prompt: "What is the first step to earn CE credit in this course?",
              choices: [
                "Complete modules and pass the final exam",
                "Skip to the certificate page",
                "Only open the course once",
                "Email support for a waiver",
              ],
              correctIndex: 0,
            },
          ],
        },
        {
          title: "Module 2 — Review & application",
          content: `${content}\n\nReview the material, apply it to your practice, and confirm you are ready for the final exam.`,
          quizQuestions: [
            {
              prompt: "Your module progress is saved so you can:",
              choices: [
                "Return later and continue where you left off",
                "Only finish in one sitting",
                "Share answers with other students",
                "Bypass the final exam",
              ],
              correctIndex: 0,
            },
          ],
        },
      ],
      examQuestions: questions.map((q) => ({
        prompt: q.prompt,
        choices: q.choices
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        correctIndex: q.correctIndex,
      })),
    };

    if (
      payload.examQuestions.length === 0 ||
      payload.examQuestions.some((q) => !q.prompt || q.choices.length < 2)
    ) {
      setError("Add at least one complete exam question with choices and an answer.");
      setSaving(false);
      return;
    }

    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setError("Unable to save course. Check your permissions and try again.");
      setSaving(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-6">
      {error && (
        <p className="rounded-sm bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <label className="block text-sm font-medium text-navy">
        Course title
        <input
          name="title"
          required
          className="mt-1 w-full border border-line px-3 py-2"
          placeholder="MRI Safety Essentials"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block text-sm font-medium text-navy">
          Category
          <input
            name="category"
            defaultValue="Radiography"
            className="mt-1 w-full border border-line px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          CE credits
          <input
            name="credits"
            type="number"
            min={1}
            defaultValue={2}
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
            defaultValue={49}
            className="mt-1 w-full border border-line px-3 py-2"
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-navy">
        Short description
        <textarea
          name="description"
          required
          rows={3}
          className="mt-1 w-full border border-line px-3 py-2"
        />
      </label>

      <label className="block text-sm font-medium text-navy">
        Course content / modules
        <textarea
          name="content"
          required
          rows={5}
          className="mt-1 w-full border border-line px-3 py-2"
        />
      </label>

      <div className="border border-teal/30 bg-teal/5 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-navy">
              Bulk upload questions & answers
            </p>
            <p className="mt-1 text-sm text-muted">
              Paste a full exam bank or upload a .txt / .csv file. Correct
              answers can be marked with <strong>*</strong> on the choice, or
              with <strong>Answer: B</strong>.
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
            onChange={(e) => onFileSelected(e.target.files?.[0] || null)}
          />
        </div>

        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={10}
          className="mt-4 w-full border border-line bg-white px-3 py-2 font-mono text-xs leading-relaxed"
          placeholder={BULK_PLACEHOLDER}
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
          <button
            type="button"
            className="btn btn-ghost !px-3 !py-2 text-sm"
            onClick={() => setBulkText(BULK_PLACEHOLDER)}
          >
            Insert sample format
          </button>
        </div>

        {bulkNotice && (
          <p className="mt-3 text-sm font-medium text-teal">{bulkNotice}</p>
        )}

        <details className="mt-4 text-sm text-muted">
          <summary className="cursor-pointer font-medium text-navy">
            CSV format
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-sm bg-white p-3 text-xs text-ink/80">
{`question,choice1,choice2,choice3,choice4,correct
"What does ALARA mean?","As Low As Reasonably Achievable","Average Level...","Automated...","Applied...",A
"Collimation is used to:","Increase dose","Reduce scatter *","Increase blur","Eliminate grids",B`}
          </pre>
          <p className="mt-2">
            The last column is the answer: letter <code>A</code>–<code>D</code>,
            or a 0-based / 1-based index.
          </p>
        </details>
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
        <div className="mt-3 space-y-4">
          {questions.map((q, index) => (
            <div key={index} className="border border-line p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-navy">
                  Question {index + 1}
                </p>
                {questions.length > 1 && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-danger"
                    onClick={() =>
                      setQuestions((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    Remove
                  </button>
                )}
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
                        i === index ? { ...item, choices: e.target.value } : item,
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
        <input type="checkbox" name="published" defaultChecked />
        Publish to catalog immediately
      </label>
      <label className="flex items-center gap-2 text-sm text-navy">
        <input type="checkbox" name="featured" />
        Feature on homepage and catalog
      </label>

      <button type="submit" disabled={saving} className="btn btn-primary">
        {saving ? "Uploading…" : "Upload course"}
      </button>
    </form>
  );
}
