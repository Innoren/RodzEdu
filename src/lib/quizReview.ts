import type { ExamAnswerReview, ExamQuestion } from "@/lib/types";

/** Build per-question right/wrong feedback for module quizzes. */
export function buildQuizAnswerReview(
  questions: ExamQuestion[],
  answers: number[],
): ExamAnswerReview[] {
  return questions.map((q, i) => {
    const selectedIndex = Number(answers[i]);
    const isCorrect = selectedIndex === q.correctIndex;
    const selectedChoice =
      selectedIndex >= 0 && selectedIndex < q.choices.length
        ? q.choices[selectedIndex]
        : "No answer selected";
    const correctChoice = q.choices[q.correctIndex] || "Correct answer";
    const correctReason =
      q.explanation?.trim() ||
      `"${correctChoice}" is correct based on this module’s lesson content.`;
    const incorrectReason = isCorrect
      ? ""
      : `"${selectedChoice}" is not correct. Review the module content and choose the option that matches the safety principle being tested.`;

    return {
      questionId: q.id,
      prompt: q.prompt,
      selectedIndex,
      correctIndex: q.correctIndex,
      selectedChoice,
      correctChoice,
      isCorrect,
      incorrectReason,
      correctReason,
    };
  });
}
