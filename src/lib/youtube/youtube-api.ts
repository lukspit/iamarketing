import { google, youtube_v3 } from "googleapis";
import { youtubeApiLimiter } from "./rate-limiter";

export interface VideoMetadata {
  videoId: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  duration: string;
  durationSeconds: number;
  thumbnailUrl: string;
  videoUrl: string;
  tags: string[];
}

export interface ChannelInfo {
  channelId: string;
  title: string;
  subscriberCount: number;
  videoCount: number;
}

export function createYouTubeClient(): youtube_v3.Youtube {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "YOUTUBE_API_KEY not found. See docs/youtube-setup.md for instructions."
    );
  }
  return google.youtube({ version: "v3", auth: apiKey });
}

export async function resolveChannelId(
  youtube: youtube_v3.Youtube,
  handleOrUrl: string
): Promise<ChannelInfo | null> {
  await youtubeApiLimiter.wait();

  // Extract handle from URL if needed (e.g. youtube.com/@AlexHormozi → @AlexHormozi)
  let handle = handleOrUrl;
  const handleMatch = handleOrUrl.match(/@[\w.-]+/);
  if (handleMatch) {
    handle = handleMatch[0];
  }

  // Try forHandle first
  const response = await youtube.channels.list({
    part: ["snippet", "statistics"],
    forHandle: handle.replace("@", ""),
    maxResults: 1,
  });

  const channel = response.data.items?.[0];
  if (!channel) return null;

  return {
    channelId: channel.id!,
    title: channel.snippet?.title || "",
    subscriberCount: parseInt(channel.statistics?.subscriberCount || "0"),
    videoCount: parseInt(channel.statistics?.videoCount || "0"),
  };
}

export async function fetchChannelVideos(
  youtube: youtube_v3.Youtube,
  channelId: string,
  maxResults: number = 50
): Promise<string[]> {
  const videoIds: string[] = [];
  let pageToken: string | undefined;

  while (videoIds.length < maxResults) {
    await youtubeApiLimiter.wait();

    const response = await youtube.search.list({
      part: ["id"],
      channelId,
      type: ["video"],
      order: "date",
      maxResults: Math.min(50, maxResults - videoIds.length),
      pageToken,
    });

    const items = response.data.items || [];
    for (const item of items) {
      if (item.id?.videoId) {
        videoIds.push(item.id.videoId);
      }
    }

    pageToken = response.data.nextPageToken || undefined;
    if (!pageToken || items.length === 0) break;
  }

  return videoIds;
}

export async function fetchVideoDetails(
  youtube: youtube_v3.Youtube,
  videoIds: string[]
): Promise<VideoMetadata[]> {
  const results: VideoMetadata[] = [];

  // videos.list accepts up to 50 IDs per call
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    await youtubeApiLimiter.wait();

    const response = await youtube.videos.list({
      part: ["snippet", "statistics", "contentDetails"],
      id: batch,
    });

    for (const item of response.data.items || []) {
      const snippet = item.snippet;
      const stats = item.statistics;
      const content = item.contentDetails;

      results.push({
        videoId: item.id!,
        title: snippet?.title || "",
        description: snippet?.description || "",
        channelId: snippet?.channelId || "",
        channelTitle: snippet?.channelTitle || "",
        publishedAt: snippet?.publishedAt || "",
        viewCount: parseInt(stats?.viewCount || "0"),
        likeCount: parseInt(stats?.likeCount || "0"),
        duration: content?.duration || "",
        durationSeconds: parseDuration(content?.duration || ""),
        thumbnailUrl:
          snippet?.thumbnails?.high?.url ||
          snippet?.thumbnails?.default?.url ||
          "",
        videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
        tags: snippet?.tags || [],
      });
    }
  }

  return results;
}

export function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");
  return hours * 3600 + minutes * 60 + seconds;
}
