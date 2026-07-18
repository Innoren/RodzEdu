import { createCourseAction, updateCourseAction } from "@/app/actions/courses";

type CourseFormProps = {
  mode: "create" | "edit";
  error?: string;
  course?: {
    id: string;
    title: string;
    summary: string;
    description: string;
    category: string;
    imageUrl: string | null;
    priceCents: number;
    credits: number;
    published: boolean;
  };
};

export function CourseForm({ mode, error, course }: CourseFormProps) {
  const action = mode === "create" ? createCourseAction : updateCourseAction;

  return (
    <form action={action} className="space-y-5">
      {course && <input type="hidden" name="id" value={course.id} />}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Field label="Course title">
        <input
          name="title"
          required
          defaultValue={course?.title}
          placeholder="Mammography Positioning Essentials"
          className={inputCls}
        />
      </Field>

      <Field label="Short summary">
        <input
          name="summary"
          required
          defaultValue={course?.summary}
          placeholder="A concise overview shown on course cards."
          className={inputCls}
        />
      </Field>

      <Field label="Full description">
        <textarea
          name="description"
          required
          rows={6}
          defaultValue={course?.description}
          placeholder="Describe what technologists will learn…"
          className={inputCls}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category">
          <input
            name="category"
            required
            defaultValue={course?.category}
            placeholder="Mammography"
            list="category-suggestions"
            className={inputCls}
          />
          <datalist id="category-suggestions">
            {["Mammography", "CT", "MRI", "Ultrasound", "Bone Densitometry", "Radiography", "Safety"].map(
              (c) => (
                <option key={c} value={c} />
              ),
            )}
          </datalist>
        </Field>

        <Field label="Image URL (optional)">
          <input
            name="imageUrl"
            type="url"
            defaultValue={course?.imageUrl ?? ""}
            placeholder="https://…"
            className={inputCls}
          />
        </Field>

        <Field label="Price (USD)">
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={course ? (course.priceCents / 100).toFixed(2) : "0"}
            className={inputCls}
          />
        </Field>

        <Field label="CE credits">
          <input
            name="credits"
            type="number"
            min="0"
            step="0.25"
            defaultValue={course?.credits ?? 1}
            className={inputCls}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          name="published"
          defaultChecked={course ? course.published : true}
          className="h-4 w-4 accent-brand-600"
        />
        Publish this course (visible in the catalog)
      </label>

      <button
        type="submit"
        className="rounded-lg bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700"
      >
        {mode === "create" ? "Create course" : "Save changes"}
      </button>
    </form>
  );
}

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-700">{label}</label>
      {children}
    </div>
  );
}
