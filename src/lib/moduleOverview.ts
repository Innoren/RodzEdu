function toPlainLines(content: string): string[] {
  const raw = (content || "").replace(/\r\n/g, "\n").trim();
  if (!raw) return [];

  // HTML modules: strip tags into readable line breaks.
  if (/<\/?[a-z][\s\S]*>/i.test(raw)) {
    return raw
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
      .replace(/<\/(p|div|h[1-6]|li|tr|br|aside)[^>]*>/gi, "\n")
      .replace(/<(br|hr)\s*\/?>/gi, "\n")
      .replace(/<li[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }

  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Pull a short public-facing overview from a module's full lesson text.
 * Prefers the "Module Overview" section when present.
 */
export function getModuleOverview(
  content: string,
  options?: { maxChars?: number },
): string {
  const maxChars = options?.maxChars ?? 280;
  const lines = toPlainLines(content);
  if (!lines.length) return "Lesson content available after enrollment.";

  // Prefer explicit Module Overview section.
  const overviewIdx = lines.findIndex((line) =>
    /^module overview$/i.test(line),
  );
  if (overviewIdx >= 0) {
    const collected: string[] = [];
    for (let i = overviewIdx + 1; i < lines.length; i++) {
      const line = lines[i];
      if (
        /^(learning objectives|introduction|lesson\s+\d+|rodz tip|course opening|module summary|knowledge check|key takeaways)$/i.test(
          line,
        )
      ) {
        break;
      }
      if (/^module\s+\d+\s*:/i.test(line)) break;
      collected.push(line);
      if (collected.join(" ").length >= maxChars) break;
    }
    const overview = collected.join(" ").replace(/\s+/g, " ").trim();
    if (overview) return truncateAtSentence(overview, maxChars);
  }

  // Fall back to first substantive paragraph (skip headings).
  for (const line of lines) {
    if (
      /^(module\s+\d+|learning objectives|introduction|lesson\s+\d+|slide\s+\d+|speaker notes|rodz tip)/i.test(
        line,
      )
    ) {
      continue;
    }
    if (line.length < 40) continue;
    return truncateAtSentence(line.replace(/\s+/g, " ").trim(), maxChars);
  }

  return truncateAtSentence(lines.join(" ").replace(/\s+/g, " "), maxChars);
}

function truncateAtSentence(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const sentenceEnd = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
  );
  if (sentenceEnd > maxChars * 0.45) {
    return slice.slice(0, sentenceEnd + 1).trim();
  }
  const space = slice.lastIndexOf(" ");
  return `${(space > 40 ? slice.slice(0, space) : slice).trim()}…`;
}
