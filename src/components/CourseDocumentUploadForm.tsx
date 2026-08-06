"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  DEFAULT_UPLOAD_PRESET_ID,
  listUploadPresets,
  type UploadPresetId,
} from "@/lib/uploadPresets";

export function CourseDocumentUploadForm() {
  const router = useRouter();
  const presets = useMemo(() => listUploadPresets(), []);
  const [presetId, setPresetId] = useState<UploadPresetId>(
    DEFAULT_UPLOAD_PRESET_ID,
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedPreset =
    presets.find((preset) => preset.id === presetId) || presets[0];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("uploadPreset", presetId);

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
        `Created “${json.course.title}” with ${summary.modules} modules, ${summary.moduleQuizzes} module-quiz questions, and ${summary.examQuestions} final-exam questions using “${summary.preset || selectedPreset.label}”.`,
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
          Upload any Rodz-style course workbook and final exam as{" "}
          <strong>.docx</strong> files. Choose an upload style below — the
          formatted preset keeps headings, lists, and emphasis for every
          course, not just MRI.
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

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-navy">
          Upload style preset
        </legend>
        <p className="text-xs text-muted">
          Admins and CEOs can pick how lesson content is formatted when the
          course is created.
        </p>
        <div className="grid gap-3">
          {presets.map((preset) => {
            const checked = preset.id === presetId;
            return (
              <label
                key={preset.id}
                className={`block cursor-pointer border px-4 py-3 transition ${
                  checked
                    ? "border-teal bg-teal/5"
                    : "border-line bg-white hover:border-navy/30"
                }`}
              >
                <span className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="uploadPresetChoice"
                    value={preset.id}
                    checked={checked}
                    onChange={() => setPresetId(preset.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium text-navy">
                      {preset.label}
                      {preset.id === DEFAULT_UPLOAD_PRESET_ID ? (
                        <span className="ml-2 text-xs font-normal text-teal">
                          Recommended
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-sm text-muted">
                      {preset.description}
                    </span>
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        <input type="hidden" name="uploadPreset" value={presetId} />
      </fieldset>

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
            Any course workbook with “Module 1: …” sections
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
            Final exam with Question 1 / A–D / Correct Answer format
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
