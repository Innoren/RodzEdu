import Link from "next/link";

export function OpenExamButton({
  enrollmentId,
  disabled,
  label = "Take final exam",
  hint,
}: {
  enrollmentId: string;
  disabled?: boolean;
  label?: string;
  hint?: string;
}) {
  if (disabled) {
    return (
      <div>
        <button
          type="button"
          disabled
          className="btn btn-primary !px-3 !py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {label}
        </button>
        {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/exam/${enrollmentId}`}
        className="btn btn-primary !px-3 !py-2 text-sm"
      >
        {label}
      </Link>
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
