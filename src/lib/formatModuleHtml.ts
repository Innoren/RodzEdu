const SECTION_HEADINGS = [
  "Module Overview",
  "Learning Objectives",
  "Introduction",
  "Course Opening",
  "A Message from the Instructor",
  "Rodz Tip",
  "Real Clinical Experience",
  "Module Summary",
  "Key Takeaways",
  "Closing Message",
  "References",
  "Evidence-Based Practice",
  "Module Description",
];

const TIP_HEADINGS = ["Rodz Tip"];

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

/** Promote Word <strong> section labels into real headings / tip callouts. */
export function polishModuleHtml(html: string): string {
  let out = html;
  for (const heading of SECTION_HEADINGS) {
    out = out.replace(
      new RegExp(
        `<p>\\s*<strong>\\s*${escapeRegex(heading)}\\s*</strong>\\s*</p>`,
        "gi",
      ),
      `<h3 class="module-heading">${heading}</h3>`,
    );
  }
  out = out.replace(
    /<p>\s*<strong>\s*(Lesson\s+\d+\s*:\s*[^<]+)<\/strong>\s*<\/p>/gi,
    '<h3 class="module-heading">$1</h3>',
  );

  // Rodz Tip heading + following paragraph → tip callout (matches Word layout).
  for (const tip of TIP_HEADINGS) {
    out = out.replace(
      new RegExp(
        `<h3 class="module-heading">${escapeRegex(tip)}<\\/h3>\\s*<p>([\\s\\S]*?)<\\/p>`,
        "gi",
      ),
      `<h3 class="module-heading">${tip}</h3><aside class="module-tip"><p>$1</p></aside>`,
    );
  }

  // Drop repeated course-title banners inside a module body.
  out = out.replace(
    /<p>\s*<strong>\s*[^<]{0,80}Essentials\s*<\/strong>\s*<\/p>/gi,
    (match) => (/module\s+\d+/i.test(match) ? match : ""),
  );

  // Collapse near-duplicate consecutive paragraphs (common in Word drafts).
  out = collapseNearDuplicateParagraphs(out);
  return out.trim();
}

function normalizeComparableText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "");
}

function collapseNearDuplicateParagraphs(html: string): string {
  return html.replace(
    /(<p\b[^>]*>[\s\S]*?<\/p>)(\s*)(<p\b[^>]*>[\s\S]*?<\/p>)/gi,
    (full, first: string, space: string, second: string) => {
      const a = normalizeComparableText(first);
      const b = normalizeComparableText(second);
      if (!a || !b) return full;
      if (a === b) return first;
      // Near-duplicate: same opening clause (e.g. two “MRI technology continues…” lines).
      const aStart = a.slice(0, 48);
      const bStart = b.slice(0, 48);
      if (
        aStart.length >= 40 &&
        aStart === bStart &&
        Math.abs(a.length - b.length) < 40
      ) {
        // Prefer the longer / more complete wording.
        return a.length >= b.length ? first : second;
      }
      return full;
    },
  );
}

/**
 * Split mammoth HTML into per-module bodies keyed by module number.
 * Cuts each module before its Knowledge Check.
 */
export function extractModuleHtmlByNumber(courseHtml: string): Map<number, string> {
  const map = new Map<number, string>();
  const marker =
    /<p>\s*<strong>\s*Module\s+(\d+)\s*:\s*([\s\S]*?)<\/strong>\s*<\/p>/gi;
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
      /<p>\s*<strong>\s*(?:Final\s+)?Knowledge Check\s*<\/strong>\s*<\/p>/i,
    );
    if (quizCut >= 0) slice = slice.slice(0, quizCut);
    map.set(num, polishModuleHtml(slice));
  }

  return map;
}

/**
 * Convert already-imported plain module text into structured HTML so the
 * learner view keeps Word-like hierarchy (headings, lists, tips).
 */
export function plainTextToModuleHtml(content: string): string {
  const lines = (content || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return "<p>No lesson content.</p>";

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
      SECTION_HEADINGS.some((h) => h.toLowerCase() === line.toLowerCase()) ||
      /^lesson\s+\d+\s*:/i.test(line)
    ) {
      const heading = line;
      html.push(`<h3 class="module-heading">${escapeHtml(heading)}</h3>`);
      i += 1;

      // Learning Objectives → collect following short objective lines as a list.
      if (/^learning objectives$/i.test(heading)) {
        const items: string[] = [];
        while (i < lines.length) {
          const next = lines[i];
          if (
            SECTION_HEADINGS.some((h) => h.toLowerCase() === next.toLowerCase()) ||
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
          // Objective-like lines: sentence fragments / not long paragraphs
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
      } else if (/^rodz tip$/i.test(heading)) {
        const tip: string[] = [];
        while (
          i < lines.length &&
          !SECTION_HEADINGS.some((h) => h.toLowerCase() === lines[i].toLowerCase()) &&
          !/^lesson\s+\d+\s*:/i.test(lines[i])
        ) {
          tip.push(lines[i]);
          i += 1;
          if (tip.join(" ").length > 400) break;
        }
        if (tip.length) {
          // Keep the tip label as a heading, body in the callout (Word style).
          html.push(
            `<aside class="module-tip"><p>${escapeHtml(tip.join(" "))}</p></aside>`,
          );
        }
      } else if (/^key takeaways$/i.test(heading)) {
        const items: string[] = [];
        while (
          i < lines.length &&
          !SECTION_HEADINGS.some((h) => h.toLowerCase() === lines[i].toLowerCase()) &&
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

    // Question-style lines in body (shouldn't usually appear before quiz)
    if (/^\d+\.\s+/.test(line) && i + 1 < lines.length && /^[A-D][).]/.test(lines[i + 1])) {
      break;
    }

    html.push(`<p>${escapeHtml(line)}</p>`);
    i += 1;

    // After an intro like “ask yourself:” / “Never assume:”, collect short list items.
    if (
      /:\s*$/.test(line) &&
      (/(ask yourself|never assume|responsible for|protecting|include|following)\b/i.test(
        line,
      ) ||
        /^before every/i.test(line))
    ) {
      const items: string[] = [];
      while (i < lines.length) {
        const next = lines[i];
        if (
          SECTION_HEADINGS.some((h) => h.toLowerCase() === next.toLowerCase()) ||
          /^lesson\s+\d+\s*:/i.test(next) ||
          /^\d+\.\s+/.test(next)
        ) {
          break;
        }
        const listLike =
          (next.length < 160 &&
            (/\?$/.test(next) ||
              /^[A-Z]/.test(next) ||
              /^[-•*]/.test(next))) &&
          !/[.!]{2,}/.test(next);
        if (!listLike) break;
        items.push(next.replace(/^[-•*]\s*/, ""));
        i += 1;
        if (items.length >= 12) break;
      }
      if (items.length >= 2) {
        html.push(
          `<ul class="module-list">${items
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul>`,
        );
      } else {
        // Not enough items — put them back as paragraphs.
        for (const item of items) {
          html.push(`<p>${escapeHtml(item)}</p>`);
        }
      }
    }
  }

  return html.join("\n");
}

/** Return sanitized HTML ready for the learner view. */
export function toRenderableModuleHtml(content: string): string {
  if (looksLikeHtml(content)) {
    return sanitizeCourseHtml(polishModuleHtml(content));
  }
  return sanitizeCourseHtml(plainTextToModuleHtml(content));
}
