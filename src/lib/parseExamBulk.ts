export type ParsedQuestion = {
  prompt: string;
  choices: string;
  correctIndex: number;
};

/**
 * Supports:
 * 1) Block format (recommended):
 *    Q: What is ALARA?
 *    A) As Low As Reasonably Achievable *
 *    B) Average Level And Radiation Allowance
 *    C) Automated Low Area Risk Assessment
 *    D) Applied Linear Attenuation Rating Average
 *
 *    Correct answers can be marked with * on the choice line,
 *    or with a line like: Answer: B   /   Correct: 2
 *
 * 2) CSV format:
 *    question,choice1,choice2,choice3,choice4,correct
 *    "Prompt text","Choice A","Choice B","Choice C","Choice D",B
 *    correct may be a letter (A-D) or 0-based / 1-based index
 */
export function parseExamBulk(raw: string): {
  questions: ParsedQuestion[];
  error?: string;
} {
  const text = raw.replace(/^\uFEFF/, "").trim();
  if (!text) {
    return { questions: [], error: "Paste or upload exam content first." };
  }

  if (looksLikeCsv(text)) {
    return parseCsv(text);
  }

  return parseBlocks(text);
}

function looksLikeCsv(text: string): boolean {
  const first = text.split(/\r?\n/).find((line) => line.trim()) || "";
  return (
    /^question\s*,/i.test(first) ||
    (first.includes(",") && !/^q[:\s]/i.test(first) && !/^[A-D][).]/i.test(first))
  );
}

function parseCsv(text: string): {
  questions: ParsedQuestion[];
  error?: string;
} {
  const rows = splitCsvRows(text);
  if (rows.length === 0) {
    return { questions: [], error: "No CSV rows found." };
  }

  let start = 0;
  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  if (header[0] === "question" || header[0] === "prompt") {
    start = 1;
  }

  const questions: ParsedQuestion[] = [];

  for (let i = start; i < rows.length; i++) {
    const cells = rows[i].map((c) => c.trim());
    if (cells.every((c) => !c)) continue;

    const prompt = cells[0];
    if (!prompt) continue;

    const answerCell = cells[cells.length - 1];
    const choiceCells = cells
      .slice(1, -1)
      .map((choice) => choice.replace(/\*+\s*$/, "").trim())
      .filter(Boolean);

    if (choiceCells.length < 2) {
      return {
        questions: [],
        error: `Row ${i + 1}: need at least 2 choices plus a correct-answer column.`,
      };
    }

    const correctIndex = resolveAnswerIndex(answerCell, choiceCells);
    if (correctIndex < 0 || correctIndex >= choiceCells.length) {
      return {
        questions: [],
        error: `Row ${i + 1}: could not read correct answer "${answerCell}". Use A–D or an index.`,
      };
    }

    questions.push({
      prompt,
      choices: choiceCells.join("\n"),
      correctIndex,
    });
  }

  if (questions.length === 0) {
    return { questions: [], error: "No valid CSV questions found." };
  }

  return { questions };
}

function parseBlocks(text: string): {
  questions: ParsedQuestion[];
  error?: string;
} {
  const chunks = text
    .split(/\n\s*\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const questions: ParsedQuestion[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const lines = chunks[i]
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) continue;

    let prompt = "";
    const choices: { text: string; starred: boolean }[] = [];
    let answerHint = "";

    for (const line of lines) {
      const answerMatch = line.match(/^(?:answer|correct)\s*[:\-]\s*(.+)$/i);
      if (answerMatch) {
        answerHint = answerMatch[1].trim();
        continue;
      }

      const choiceMatch = line.match(/^([A-Da-d]|[1-9]\d*)[).:\-]\s*(.+)$/);
      if (choiceMatch && prompt) {
        let text = choiceMatch[2].trim();
        let starred = false;
        if (text.endsWith("*")) {
          starred = true;
          text = text.replace(/\*+\s*$/, "").trim();
        }
        choices.push({ text, starred });
        continue;
      }

      const questionMatch = line.match(/^(?:q(?:uestion)?\s*\d*\s*[:.)\-]\s*)(.+)$/i);
      if (questionMatch) {
        prompt = questionMatch[1].trim();
        continue;
      }

      if (!prompt) {
        prompt = line.replace(/^\d+[).:\-]\s*/, "").trim();
      }
    }

    if (!prompt) {
      return {
        questions: [],
        error: `Block ${i + 1}: missing question text. Start with "Q: ..."`,
      };
    }

    if (choices.length < 2) {
      return {
        questions: [],
        error: `Block ${i + 1}: need at least 2 choices (A) (B) ...`,
      };
    }

    let correctIndex = choices.findIndex((c) => c.starred);
    if (correctIndex < 0 && answerHint) {
      correctIndex = resolveAnswerIndex(
        answerHint,
        choices.map((c) => c.text),
      );
    }

    if (correctIndex < 0) {
      return {
        questions: [],
        error: `Block ${i + 1}: mark the correct choice with * or add "Answer: B".`,
      };
    }

    questions.push({
      prompt,
      choices: choices.map((c) => c.text).join("\n"),
      correctIndex,
    });
  }

  if (questions.length === 0) {
    return {
      questions: [],
      error: "No questions found. Use the block format or CSV template below.",
    };
  }

  return { questions };
}

function resolveAnswerIndex(raw: string, choices: string[]): number {
  const value = raw.trim();
  if (!value) return -1;

  const letter = value.match(/^([A-Da-d])(?:\b|[).:])/);
  if (letter) {
    return letter[1].toUpperCase().charCodeAt(0) - 65;
  }

  if (/^\d+$/.test(value)) {
    const n = Number(value);
    if (n >= 0 && n < choices.length) return n;
    if (n >= 1 && n <= choices.length) return n - 1;
  }

  const byText = choices.findIndex(
    (choice) => choice.toLowerCase() === value.toLowerCase(),
  );
  return byText;
}

function splitCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim()));
}
