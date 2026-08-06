/**
 * Document upload styles available to admin/CEO when creating courses
 * from Word workbooks. Each preset controls parsing + lesson formatting.
 */

export type UploadPresetId = "rodz-workbook" | "plain-text";

export type UploadPreset = {
  id: UploadPresetId;
  label: string;
  description: string;
  /** Keep Word bold, lists, and structure via HTML. */
  preserveWordFormatting: boolean;
  /**
   * Apply Rodz lesson layout: section headings, objective lists,
   * tip callouts, and key-takeaway bullets.
   */
  applyLessonLayout: boolean;
  /** Labels promoted to module headings (case-insensitive match). */
  sectionHeadings: string[];
  /** Tip-style headings wrapped in a callout. */
  tipHeadings: string[];
};

const RODZ_SECTION_HEADINGS = [
  "Module Overview",
  "Learning Objectives",
  "Introduction",
  "Course Opening",
  "A Message from the Instructor",
  "Rodz Tip",
  "Clinical Tip",
  "Instructor Tip",
  "Pro Tip",
  "Tip",
  "Module Summary",
  "Key Takeaways",
  "Closing Message",
  "References",
  "Evidence-Based Practice",
  "Module Description",
  "Summary",
  "Objectives",
];

const RODZ_TIP_HEADINGS = [
  "Rodz Tip",
  "Clinical Tip",
  "Instructor Tip",
  "Pro Tip",
  "Tip",
];

export const UPLOAD_PRESETS: UploadPreset[] = [
  {
    id: "rodz-workbook",
    label: "Rodz Workbook (formatted)",
    description:
      "Best for Rodz course workbooks + final exams. Builds modules and quizzes, keeps Word headings/lists/bold, and applies the standard lesson layout (objectives, tips, takeaways).",
    preserveWordFormatting: true,
    applyLessonLayout: true,
    sectionHeadings: RODZ_SECTION_HEADINGS,
    tipHeadings: RODZ_TIP_HEADINGS,
  },
  {
    id: "plain-text",
    label: "Plain text modules",
    description:
      "Same module/quiz/exam parsing, but lesson bodies stay as simple paragraphs without extra layout polish.",
    preserveWordFormatting: false,
    applyLessonLayout: false,
    sectionHeadings: [],
    tipHeadings: [],
  },
];

export const DEFAULT_UPLOAD_PRESET_ID: UploadPresetId = "rodz-workbook";

export function isUploadPresetId(value: string): value is UploadPresetId {
  return UPLOAD_PRESETS.some((preset) => preset.id === value);
}

export function getUploadPreset(id?: string | null): UploadPreset {
  if (id && isUploadPresetId(id)) {
    return UPLOAD_PRESETS.find((preset) => preset.id === id)!;
  }
  return UPLOAD_PRESETS.find(
    (preset) => preset.id === DEFAULT_UPLOAD_PRESET_ID,
  )!;
}

export function listUploadPresets(): UploadPreset[] {
  return UPLOAD_PRESETS;
}
