export interface TextChunk {
  content: string;
  chunkIndex: number;
  pageNumber: number | null;
  sectionTitle: string | null;
  tokenCount: number;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function extractSectionTitle(text: string): string | null {
  const firstLine = text.split("\n")[0]?.trim();
  if (!firstLine) return null;
  if (
    firstLine.length < 80 &&
    !firstLine.endsWith(".") &&
    !firstLine.endsWith(",")
  ) {
    return firstLine;
  }
  return null;
}

export function chunkDocument(
  pages: { pageNumber: number; text: string }[],
  options: {
    targetChunkSize?: number;
    maxChunkSize?: number;
    overlapSize?: number;
  } = {}
): TextChunk[] {
  const {
    targetChunkSize = 600,
    maxChunkSize = 800,
    overlapSize = 100,
  } = options;

  const maxChars = maxChunkSize * 4;
  const overlapChars = overlapSize * 4;

  const segments: { text: string; pageNumber: number }[] = [];
  for (const page of pages) {
    const paragraphs = page.text.split(/\n{2,}/);
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (trimmed.length > 0) {
        segments.push({ text: trimmed, pageNumber: page.pageNumber });
      }
    }
  }

  if (segments.length === 0) return [];

  const chunks: TextChunk[] = [];
  let currentText = "";
  let currentPage = segments[0]?.pageNumber ?? 1;
  let chunkIndex = 0;

  for (const segment of segments) {
    const candidate = currentText
      ? currentText + "\n\n" + segment.text
      : segment.text;

    if (candidate.length > maxChars) {
      if (currentText.trim()) {
        chunks.push({
          content: currentText.trim(),
          chunkIndex: chunkIndex++,
          pageNumber: currentPage,
          sectionTitle: extractSectionTitle(currentText),
          tokenCount: estimateTokens(currentText),
        });
      }

      const overlapText = currentText.slice(-overlapChars);
      currentText = overlapText + "\n\n" + segment.text;
      currentPage = segment.pageNumber;
    } else {
      currentText = candidate;
      if (!currentPage) currentPage = segment.pageNumber;
    }
  }

  if (currentText.trim()) {
    chunks.push({
      content: currentText.trim(),
      chunkIndex: chunkIndex++,
      pageNumber: currentPage,
      sectionTitle: extractSectionTitle(currentText),
      tokenCount: estimateTokens(currentText),
    });
  }

  return chunks;
}
