import { TextChunk } from "../rag/chunker";
import { TranscriptSegment } from "./transcript";
import { formatTimestamp } from "./transcript";

interface ChunkOptions {
  targetChunkSize?: number;
  maxChunkSize?: number;
  overlapSize?: number;
}

export function chunkTranscript(
  segments: TranscriptSegment[],
  options: ChunkOptions = {}
): TextChunk[] {
  const {
    targetChunkSize = 600,
    maxChunkSize = 800,
    overlapSize = 100,
  } = options;

  const maxChars = maxChunkSize * 4;
  const overlapChars = overlapSize * 4;

  if (segments.length === 0) return [];

  // Group segments into sentence-like paragraphs
  const paragraphs = groupIntoParagraphs(segments);

  if (paragraphs.length === 0) return [];

  const chunks: TextChunk[] = [];
  let currentText = "";
  let currentStartOffset = paragraphs[0].startOffset;
  let currentEndOffset = paragraphs[0].endOffset;
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const candidate = currentText
      ? currentText + "\n\n" + para.text
      : para.text;

    if (candidate.length > maxChars) {
      if (currentText.trim()) {
        chunks.push({
          content: currentText.trim(),
          chunkIndex: chunkIndex++,
          pageNumber: null,
          sectionTitle: `[${formatTimestamp(currentStartOffset)} - ${formatTimestamp(currentEndOffset)}]`,
          tokenCount: estimateTokens(currentText),
        });
      }

      // Keep overlap from end of previous chunk
      const overlapText = currentText.slice(-overlapChars);
      currentText = overlapText + "\n\n" + para.text;
      currentStartOffset = para.startOffset;
      currentEndOffset = para.endOffset;
    } else {
      currentText = candidate;
      currentEndOffset = para.endOffset;
    }
  }

  // Last chunk
  if (currentText.trim()) {
    chunks.push({
      content: currentText.trim(),
      chunkIndex: chunkIndex++,
      pageNumber: null,
      sectionTitle: `[${formatTimestamp(currentStartOffset)} - ${formatTimestamp(currentEndOffset)}]`,
      tokenCount: estimateTokens(currentText),
    });
  }

  return chunks;
}

interface Paragraph {
  text: string;
  startOffset: number;
  endOffset: number;
}

function groupIntoParagraphs(segments: TranscriptSegment[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  let currentTexts: string[] = [];
  let startOffset = segments[0].offset;
  let endOffset = segments[0].offset + segments[0].duration;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const nextSeg = segments[i + 1];

    currentTexts.push(seg.text);
    endOffset = seg.offset + seg.duration;

    // Break paragraph on:
    // 1. Gap > 3 seconds between segments (pause in speech)
    // 2. Accumulated text > ~150 words (~600 chars)
    // 3. End of segments
    const gap = nextSeg ? nextSeg.offset - (seg.offset + seg.duration) : 999;
    const combinedLength = currentTexts.join(" ").length;

    if (gap > 3 || combinedLength > 600 || !nextSeg) {
      const text = currentTexts.join(" ").trim();
      if (text.length > 0) {
        paragraphs.push({ text, startOffset, endOffset });
      }
      currentTexts = [];
      if (nextSeg) {
        startOffset = nextSeg.offset;
      }
    }
  }

  return paragraphs;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
