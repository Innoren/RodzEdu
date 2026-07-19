"use client";

export function OpenExamButton({
  enrollmentId,
  disabled,
}: {
  enrollmentId: string;
  disabled?: boolean;
}) {
  function openExam() {
    const width = Math.min(1100, window.screen.availWidth - 40);
    const height = Math.min(820, window.screen.availHeight - 40);
    const left = Math.max(0, (window.screen.availWidth - width) / 2);
    const top = Math.max(0, (window.screen.availHeight - height) / 2);

    window.open(
      `/exam/${enrollmentId}`,
      `rodzedu-exam-${enrollmentId}`,
      `popup=yes,width=${width},height=${height},left=${left},top=${top},noopener,noreferrer`,
    );
  }

  return (
    <button
      type="button"
      onClick={openExam}
      disabled={disabled}
      className="btn btn-primary !px-3 !py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
    >
      Take Exam in New Window
    </button>
  );
}
