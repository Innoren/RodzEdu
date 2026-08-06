import mammoth from "mammoth";

/** Extract plain-text paragraphs from a .docx buffer. */
function toNodeBuffer(buffer: ArrayBuffer | Buffer): Buffer {
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(new Uint8Array(buffer));
}

export async function extractDocxParagraphs(
  buffer: ArrayBuffer | Buffer,
): Promise<string[]> {
  const result = await mammoth.extractRawText({ buffer: toNodeBuffer(buffer) });
  return result.value
    .split(/\r?\n/)
    .map((line) => line.replace(/\u2705/g, "✅").trim())
    .filter(Boolean);
}

export async function extractDocxText(
  buffer: ArrayBuffer | Buffer,
): Promise<string> {
  const paragraphs = await extractDocxParagraphs(buffer);
  return paragraphs.join("\n");
}

/** Extract HTML that preserves Word bold/lists/structure via mammoth. */
export async function extractDocxHtml(
  buffer: ArrayBuffer | Buffer,
): Promise<string> {
  const result = await mammoth.convertToHtml({ buffer: toNodeBuffer(buffer) });
  return result.value;
}
