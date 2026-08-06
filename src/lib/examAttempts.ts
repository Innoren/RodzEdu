/** Final exam attempt policy: 0 = unlimited, otherwise 1 or 3. */
export type MaxExamAttempts = 0 | 1 | 3;

export const DEFAULT_MAX_EXAM_ATTEMPTS: MaxExamAttempts = 3;

export const EXAM_ATTEMPT_OPTIONS: {
  value: MaxExamAttempts;
  label: string;
}[] = [
  { value: 0, label: "No limit" },
  { value: 1, label: "1 attempt" },
  { value: 3, label: "3 attempts" },
];

export function normalizeMaxExamAttempts(value: unknown): MaxExamAttempts {
  const n = Number(value);
  if (n === 0 || n === 1 || n === 3) return n;
  return DEFAULT_MAX_EXAM_ATTEMPTS;
}

export function examAttemptLabel(max: number): string {
  const normalized = normalizeMaxExamAttempts(max);
  if (normalized === 0) return "Unlimited attempts";
  if (normalized === 1) return "1 attempt";
  return `${normalized} attempts`;
}

export function examAttemptsRemaining(
  maxExamAttempts: number,
  examAttemptCount: number,
): number | null {
  const max = normalizeMaxExamAttempts(maxExamAttempts);
  if (max === 0) return null;
  return Math.max(0, max - Math.max(0, examAttemptCount));
}

/** Whether the student may start/submit another scored exam attempt. */
export function canAttemptExam(input: {
  maxExamAttempts: number;
  examAttemptCount: number;
  status: string;
}): boolean {
  if (input.status === "completed" || input.status === "exam_passed") {
    return false;
  }
  const remaining = examAttemptsRemaining(
    input.maxExamAttempts,
    input.examAttemptCount,
  );
  return remaining === null || remaining > 0;
}
