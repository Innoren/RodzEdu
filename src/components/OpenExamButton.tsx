import Link from "next/link";

export function OpenExamButton({
  enrollmentId,
  disabled,
}: {
  enrollmentId: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="btn btn-primary !px-3 !py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        Take final exam
      </button>
    );
  }

  return (
    <Link
      href={`/exam/${enrollmentId}`}
      className="btn btn-primary !px-3 !py-2 text-sm"
    >
      Take final exam
    </Link>
  );
}
