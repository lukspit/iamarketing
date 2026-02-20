import { fetchTranscript as ytFetchTranscript } from "youtube-transcript-plus";
import { transcriptLimiter } from "./rate-limiter";

export interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

export interface FetchedTranscript {
  videoId: string;
  language: string;
  segments: TranscriptSegment[];
  fullText: string;
  totalDurationSeconds: number;
}

export async function fetchTranscript(
  videoId: string,
  preferredLanguage?: string
): Promise<FetchedTranscript | null> {
  // Try preferred language first, then fallback
  const languagesToTry = preferredLanguage
    ? [preferredLanguage, undefined]
    : [undefined];

  for (const lang of languagesToTry) {
    try {
      await transcriptLimiter.wait();

      const rawSegments = await ytFetchTranscript(videoId, {
        lang: lang || undefined,
      });

      if (!rawSegments || rawSegments.length === 0) continue;

      const segments: TranscriptSegment[] = rawSegments.map((s) => ({
        text: cleanTranscriptText(s.text),
        offset: s.offset, // already in seconds
        duration: s.duration,
      }));

      const fullText = segments.map((s) => s.text).join(" ");

      // Skip if transcript is too short (likely just intro/outro)
      if (fullText.length < 200) continue;

      const lastSegment = segments[segments.length - 1];
      const totalDuration = lastSegment.offset + lastSegment.duration;

      return {
        videoId,
        language: lang || "auto",
        segments,
        fullText,
        totalDurationSeconds: totalDuration,
      };
    } catch (error: any) {
      // Transcript not available or disabled — try next language or return null
      if (
        error?.message?.includes("Transcript is disabled") ||
        error?.message?.includes("No transcripts are available") ||
        error?.message?.includes("Could not get transcripts")
      ) {
        continue;
      }

      // Rate limit — rethrow to let caller handle backoff
      if (error?.message?.includes("Too Many Requests")) {
        throw error;
      }

      // Unknown error — log and continue
      console.warn(
        `Warning fetching transcript for ${videoId} (lang: ${lang}):`,
        error?.message || error
      );
      continue;
    }
  }

  return null;
}

function cleanTranscriptText(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
