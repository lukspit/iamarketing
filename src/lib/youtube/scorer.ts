import { VideoMetadata } from "./youtube-api";
import { YouTubeConfig } from "./config";

export interface ScoredVideo extends VideoMetadata {
  score: number;
  viewScore: number;
  recencyScore: number;
  relevanceScore: number;
}

export function scoreAndSelectVideos(
  videos: VideoMetadata[],
  config: YouTubeConfig,
  language: "en" | "pt",
  topN?: number
): ScoredVideo[] {
  const { scoring, defaults } = config;
  const keywords = config.keywords[language];
  const maxAge = defaults.maxAgeMonths;
  const effectiveTopN = topN ?? defaults.topNPerChannel;

  // Filter out shorts, very old, and low-view videos
  const filtered = videos.filter((v) => {
    if (v.durationSeconds < defaults.minDurationSeconds) return false;
    if (v.viewCount < defaults.minViews) return false;

    const ageMonths = monthsAgo(v.publishedAt);
    if (ageMonths > maxAge) return false;

    return true;
  });

  if (filtered.length === 0) return [];

  // Calculate max values for normalization
  const maxViews = Math.max(...filtered.map((v) => v.viewCount));
  const maxKeywordMatches = Math.max(
    ...filtered.map((v) => countKeywordMatches(v, keywords)),
    1
  );

  const scored: ScoredVideo[] = filtered.map((video) => {
    const viewScore = maxViews > 0
      ? Math.log10(video.viewCount + 1) / Math.log10(maxViews + 1)
      : 0;

    const ageMonths = monthsAgo(video.publishedAt);
    const recencyScore = Math.max(0, 1 - ageMonths / maxAge);

    const keywordMatches = countKeywordMatches(video, keywords);
    const relevanceScore = keywordMatches / maxKeywordMatches;

    const score =
      scoring.viewWeight * viewScore +
      scoring.recencyWeight * recencyScore +
      scoring.relevanceWeight * relevanceScore;

    return {
      ...video,
      score,
      viewScore,
      recencyScore,
      relevanceScore,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, effectiveTopN);
}

function countKeywordMatches(
  video: VideoMetadata,
  keywords: string[]
): number {
  const searchText = (
    video.title +
    " " +
    video.description +
    " " +
    video.tags.join(" ")
  ).toLowerCase();

  let count = 0;
  for (const keyword of keywords) {
    if (searchText.includes(keyword.toLowerCase())) {
      count++;
    }
  }
  return count;
}

function monthsAgo(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return (
    (now.getFullYear() - date.getFullYear()) * 12 +
    (now.getMonth() - date.getMonth())
  );
}
