import type { UploadPreset } from "@/lib/uploadPresets";
import { getUploadPreset } from "@/lib/uploadPresets";

export function looksLikeHtml(content: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(content || "");
}

/** Lightweight sanitize for trusted Word→HTML conversion. */
export function sanitizeCourseHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isSectionHeading(line: string, headings: string[]): boolean {
  const normalized = line.trim().toLowerCase();
  return headings.some((h) => h.toLowerCase() === normalized);
}

function isTipHeading(line: string, tipHeadings: string[]): boolean {
  const normalized = line.trim().toLowerCase();
  return tipHeadings.some((h) => h.toLowerCase() === normalized);
}

/** Promote Word section labels into real headings / tip callouts. */
export function polishModuleHtml(
  html: string,
  preset: UploadPreset = getUploadPreset(),
  courseTitle?: string,
): string {
  if (!preset.applyLessonLayout) return html.trim();

  let out = html;

  for (const heading of preset.sectionHeadings) {
    const replacement = isTipHeading(heading, preset.tipHeadings)
      ? null
      : `<h3 class="module-heading">${heading}</h3>`;
    if (!replacement) continue;
    out = out.replace(
      new RegExp(
        `<p>\\s*<strong>\\s*${escapeRegex(heading)}\\s*</strong>\\s*</p>`,
        "gi",
      ),
      replacement,
    );
    out = out.replace(
      new RegExp(
        `<h[1-6][^>]*>\\s*(?:<strong>)?\\s*${escapeRegex(heading)}\\s*(?:</strong>)?\\s*</h[1-6]>`,
        "gi",
      ),
      replacement,
    );
  }

  // Tip callouts from bold paragraphs.
  for (const tip of preset.tipHeadings) {
    out = out.replace(
      new RegExp(
        `<p>\\s*<strong>\\s*${escapeRegex(tip)}\\s*</strong>\\s*</p>\\s*<p>([\\s\\S]*?)</p>`,
        "gi",
      ),
      `<aside class="module-tip"><p><strong>${tip}</strong> $1</p></aside>`,
    );
  }

  out = out.replace(
    /<p>\s*<strong>\s*(Lesson\s+\d+\s*:\s*[^<]+)<\/strong>\s*<\/p>/gi,
    '<h3 class="module-heading">$1</h3>',
  );
  out = out.replace(
    /<(h[1-6])[^>]*>\s*(Lesson\s+\d+\s*:\s*[\s\S]*?)\s*<\/\1>/gi,
    '<h3 class="module-heading">$2</h3>',
  );

  // Drop repeated course-title banners inside a module body (any course).
  if (courseTitle?.trim()) {
    const title = escapeRegex(courseTitle.trim());
    out = out.replace(
      new RegExp(`<p>\\s*<strong>\\s*${title}\\s*</strong>\\s*</p>`, "gi"),
      "",
    );
    out = out.replace(
      new RegExp(`<p>\\s*${title}\\s*</p>`, "gi"),
      "",
    );
  }
  out = out.replace(
    /<p>\s*<strong>\s*Rodz Education\s*<\/strong>\s*<\/p>/gi,
    "",
  );

  return out.trim();
}

/**
 * Split mammoth HTML into per-module bodies keyed by module number.
 * Cuts each module before its Knowledge Check.
 * Works for any course using “Module N: Title” markers.
 */
export function extractModuleHtmlByNumber(
  courseHtml: string,
  preset: UploadPreset = getUploadPreset(),
  courseTitle?: string,
): Map<number, string> {
  const map = new Map<number, string>();
  // Support bold paragraphs and real Word heading styles.
  const marker =
    /<(?:p|h[1-6])[^>]*>\s*(?:<strong>)?\s*Module\s+(\d+)\s*:\s*([\s\S]*?)\s*(?:<\/strong>)?\s*<\/(?:p|h[1-6])>/gi;
  const matches = [...courseHtml.matchAll(marker)];

  for (let i = 0; i < matches.length; i++) {
    const num = Number(matches[i][1]);
    const start = matches[i].index ?? 0;
    const end =
      i + 1 < matches.length
        ? (matches[i + 1].index ?? courseHtml.length)
        : courseHtml.length;
    let slice = courseHtml.slice(start, end);
    const quizCut = slice.search(
      /<(?:p|h[1-6])[^>]*>\s*(?:<strong>)?\s*(?:Final\s+)?Knowledge Check\s*(?:<\/strong>)?\s*<\/(?:p|h[1-6])>/i,
    );
    if (quizCut >= 0) slice = slice.slice(0, quizCut);
    map.set(num, polishModuleHtml(slice, preset, courseTitle));
  }

  return map;
}

/**
 * Convert plain module text into structured HTML so the learner view
 * keeps Word-like hierarchy (headings, lists, tips).
 */
export function plainTextToModuleHtml(
  content: string,
  preset: UploadPreset = getUploadPreset(),
): string {
  const lines = (content || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return "<p>No lesson content.</p>";

  if (!preset.applyLessonLayout) {
    return lines
      .filter((line, idx) => !(idx === 0 && /^module\s+\d+\s*:/i.test(line)))
      .filter(
        (line) =>
          !/^slide\s+\d+$/i.test(line) && !/^speaker notes$/i.test(line),
      )
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join("\n");
  }

  const html: string[] = [];
  let i = 0;

  // Skip duplicate module title line — page already shows it.
  if (/^module\s+\d+\s*:/i.test(lines[0])) i = 1;

  while (i < lines.length) {
    const line = lines[i];

    if (/^slide\s+\d+$/i.test(line) || /^speaker notes$/i.test(line)) {
      i += 1;
      continue;
    }

    if (
      isSectionHeading(line, preset.sectionHeadings) ||
      /^lesson\s+\d+\s*:/i.test(line)
    ) {
      const heading = line;
      const tip = isTipHeading(heading, preset.tipHeadings);
      i += 1;

      if (tip) {
        const tipBody: string[] = [];
        while (
          i < lines.length &&
          !isSectionHeading(lines[i], preset.sectionHeadings) &&
          !/^lesson\s+\d+\s*:/i.test(lines[i])
        ) {
          tipBody.push(lines[i]);
          i += 1;
          if (tipBody.join(" ").length > 400) break;
        }
        if (tipBody.length) {
          html.push(
            `<aside class="module-tip"><p><strong>${escapeHtml(heading)}</strong> ${escapeHtml(tipBody.join(" "))}</p></aside>`,
          );
        } else {
          html.push(`<h3 class="module-heading">${escapeHtml(heading)}</h3>`);
        }
        continue;
      }

      html.push(`<h3 class="module-heading">${escapeHtml(heading)}</h3>`);

      // Learning Objectives / Objectives → bullet list.
      if (/^(learning\s+)?objectives$/i.test(heading)) {
        const items: string[] = [];
        while (i < lines.length) {
          const next = lines[i];
          if (
            isSectionHeading(next, preset.sectionHeadings) ||
            /^lesson\s+\d+\s*:/i.test(next) ||
            /^by the end of this module/i.test(next) ||
            /^after completing this module/i.test(next)
          ) {
            if (
              /^by the end of this module/i.test(next) ||
              /^after completing this module/i.test(next)
            ) {
              html.push(`<p class="module-lead">${escapeHtml(next)}</p>`);
              i += 1;
              continue;
            }
            break;
          }
          if (next.length < 220 && !/^[A-D][).]/.test(next)) {
            items.push(next);
            i += 1;
            continue;
          }
          break;
        }
        if (items.length) {
          html.push(
            `<ul class="module-list">${items
              .map((item) => `<li>${escapeHtml(item)}</li>`)
              .join("")}</ul>`,
          );
        }
      } else if (/^key takeaways$/i.test(heading)) {
        const items: string[] = [];
        while (
          i < lines.length &&
          !isSectionHeading(lines[i], preset.sectionHeadings) &&
          !/^lesson\s+\d+\s*:/i.test(lines[i])
        ) {
          const next = lines[i];
          if (next.length < 220) {
            items.push(next);
            i += 1;
            continue;
          }
          break;
        }
        if (items.length) {
          html.push(
            `<ul class="module-list">${items
              .map((item) => `<li>${escapeHtml(item)}</li>`)
              .join("")}</ul>`,
          );
        }
      }
      continue;
    }

    if (
      /^\d+\.\s+/.test(line) &&
      i + 1 < lines.length &&
      /^[A-D][).]/.test(lines[i + 1])
    ) {
      break;
    }

    html.push(`<p>${escapeHtml(line)}</p>`);
    i += 1;
  }

  return html.join("\n");
}

/** Normalize module content for storage according to the selected preset. */
export function formatModuleContentForStorage(
  content: string,
  preset: UploadPreset = getUploadPreset(),
  courseTitle?: string,
): string {
  if (!content?.trim()) return "<p>No lesson content.</p>";

  if (preset.preserveWordFormatting && looksLikeHtml(content)) {
    return sanitizeCourseHtml(polishModuleHtml(content, preset, courseTitle));
  }

  if (preset.applyLessonLayout || preset.preserveWordFormatting) {
    return sanitizeCourseHtml(plainTextToModuleHtml(content, preset));
  }

  // Plain-text preset: keep original newlines for simple display.
  return content;
}

/** Return sanitized HTML ready for the learner view. */
export function toRenderableModuleHtml(
  content: string,
  preset: UploadPreset = getUploadPreset(),
): string {
  if (looksLikeHtml(content)) {
    return sanitizeCourseHtml(polishModuleHtml(content, preset));
  }
  if (preset.applyLessonLayout) {
    return sanitizeCourseHtml(plainTextToModuleHtml(content, preset));
  }
  return sanitizeCourseHtml(
    (content || "")
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join("\n") || "<p>No lesson content.</p>",
  );
}
