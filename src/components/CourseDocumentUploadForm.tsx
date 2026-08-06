"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CourseDocumentUploadForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/courses/from-documents", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Unable to create course from documents.");
        return;
      }

      const summary = json.summary;
      setNotice(
        `Created “${json.course.title}” with ${summary.modules} modules, ${summary.moduleQuizzes} module-quiz questions, and ${summary.examQuestions} final-exam questions.`,
      );
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Unable to upload documents. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy">
          Create from Word documents
        </h2>
        <p className="mt-2 text-sm text-muted">
          Upload any Rodz course workbook and final exam as{" "}
          <strong>.docx</strong> files. Modules, quizzes, and the final exam are
          built automatically, and lesson formatting from Word (headings, lists,
          bold, Rodz Tips) is applied by default.
        </p>
      </div>

      {error ? (
        <p className="rounded-sm bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-sm bg-teal/10 px-3 py-2 text-sm text-navy">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-navy">
          Course workbook (.docx)
          <input
            name="courseDocument"
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            required
            className="mt-1 w-full border border-line px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-sand file:px-3 file:py-1.5"
          />
          <span className="mt-1 block text-xs text-muted">
            Any workbook with “Module 1: …” sections
          </span>
        </label>
        <label className="block text-sm font-medium text-navy">
          Final exam (.docx)
          <input
            name="examDocument"
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            required
            className="mt-1 w-full border border-line px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-sand file:px-3 file:py-1.5"
          />
          <span className="mt-1 block text-xs text-muted">
            Question 1 / A–D / Correct Answer format
          </span>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-navy">
          Title override (optional)
          <input
            name="title"
            className="mt-1 w-full border border-line px-3 py-2"
            placeholder="Leave blank to use document title"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Category (optional)
          <input
            name="category"
            className="mt-1 w-full border border-line px-3 py-2"
            placeholder="Auto from title (MRI, CT, Mammography…)"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block text-sm font-medium text-navy">
          CE credits override
          <input
            name="credits"
            type="number"
            min={0}
            step={1}
            className="mt-1 w-full border border-line px-3 py-2"
            placeholder="Auto from document"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Price (USD)
          <input
            name="price"
            type="number"
            min={0}
            step={0.01}
            required
            defaultValue={49}
            className="mt-1 w-full border border-line px-3 py-2"
          />
        </label>
        <div className="flex flex-col justify-end gap-2 pb-1">
          <label className="flex items-center gap-2 text-sm text-navy">
            <input type="checkbox" name="published" defaultChecked />
            Publish immediately
          </label>
          <label className="flex items-center gap-2 text-sm text-navy">
            <input type="checkbox" name="featured" />
            Feature on homepage
          </label>
        </div>
      </div>

      <label className="block text-sm font-medium text-navy">
        Description override (optional)
        <textarea
          name="description"
          rows={3}
          className="mt-1 w-full border border-line px-3 py-2"
          placeholder="Leave blank to use the course mission from the workbook"
        />
      </label>

      <button type="submit" disabled={saving} className="btn btn-primary">
        {saving ? "Creating course…" : "Upload documents & create course"}
      </button>
    </form>
  );
}
