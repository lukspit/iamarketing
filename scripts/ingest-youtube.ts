import { config } from "dotenv";
import { join } from "path";
import { readFileSync, existsSync } from "fs";

config({ path: join(__dirname, "..", ".env.local") });

async function main() {
  const args = process.argv.slice(2);
  const wave = getArgValue(args, "--wave", "");
  const topN = parseInt(getArgValue(args, "--top", "10"));
  const singleVideoArg = getArgValue(args, "--video", "");
  const fromDiscovery = getArgValue(args, "--from-discovery", "");
  const channelFilter = getArgValue(args, "--channel", "");
  const batchSize = parseInt(getArgValue(args, "--batch-size", "50"));

  // Dynamic imports after env is loaded
  const { createYouTubeClient, fetchChannelVideos, fetchVideoDetails } =
    await import("../src/lib/youtube/youtube-api");
  const { scoreAndSelectVideos } = await import("../src/lib/youtube/scorer");
  const { YOUTUBE_CONFIG } = await import("../src/lib/youtube/config");
  const { fetchTranscript } = await import("../src/lib/youtube/transcript");
  const { ingestYouTubeVideo, isVideoIngested } = await import(
    "../src/lib/youtube/ingest-youtube"
  );
  const { sleep } = await import("../src/lib/youtube/rate-limiter");

  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalNoTranscript = 0;
  let totalErrors = 0;
  let totalChunks = 0;

  // Mode 1: Single video by ID or URL
  if (singleVideoArg) {
    const videoId = extractVideoId(singleVideoArg);
    if (!videoId) {
      console.error("Invalid video ID or URL:", singleVideoArg);
      process.exit(1);
    }

    console.log(`\nIngesting single video: ${videoId}`);

    if (await isVideoIngested(videoId)) {
      console.log("Already ingested, skipping.");
      return;
    }

    const youtube = createYouTubeClient();
    const [video] = await fetchVideoDetails(youtube, [videoId]);
    if (!video) {
      console.error("Video not found.");
      process.exit(1);
    }

    console.log(`  Title: ${video.title}`);
    console.log(`  Channel: ${video.channelTitle}`);
    console.log(`  Views: ${video.viewCount.toLocaleString()}`);

    console.log(`  Fetching transcript...`);
    const transcript = await fetchTranscript(videoId);
    if (!transcript) {
      console.error("  No transcript available for this video.");
      process.exit(1);
    }

    console.log(
      `  Transcript: ${transcript.segments.length} segments, ${transcript.fullText.length} chars`
    );

    console.log(`  Ingesting...`);
    const result = await ingestYouTubeVideo(video, transcript);
    console.log(
      `  Done! ${result.chunkCount} chunks (document: ${result.documentId})`
    );
    return;
  }

  // Mode 2: From previously discovered JSON
  if (fromDiscovery) {
    if (!existsSync(fromDiscovery)) {
      console.error("Discovery file not found:", fromDiscovery);
      process.exit(1);
    }

    const discovery = JSON.parse(readFileSync(fromDiscovery, "utf-8"));
    console.log(
      `\nIngesting from discovery file: ${fromDiscovery}`
    );
    console.log(
      `  Wave ${discovery.wave}, ${discovery.channels.length} channels\n`
    );

    for (const channelData of discovery.channels) {
      if (
        channelFilter &&
        !channelData.channelName
          .toLowerCase()
          .includes(channelFilter.toLowerCase())
      ) {
        continue;
      }

      console.log(`\nChannel: ${channelData.channelName}`);

      for (const video of channelData.selectedVideos) {
        if (await isVideoIngested(video.videoId)) {
          console.log(`  [skip] Already ingested: ${video.title}`);
          totalSkipped++;
          continue;
        }

        try {
          console.log(`  Processing: ${video.title}`);
          const transcript = await fetchTranscript(video.videoId);

          if (!transcript) {
            console.log(`    -> No transcript available`);
            totalNoTranscript++;
            continue;
          }

          const result = await ingestYouTubeVideo(video, transcript);
          totalProcessed++;
          totalChunks += result.chunkCount;
          console.log(`    -> ${result.chunkCount} chunks ingested`);
          await sleep(1500);
        } catch (error) {
          totalErrors++;
          console.error(
            `    -> ERROR: ${error instanceof Error ? error.message : error}`
          );
        }
      }
    }

    printSummary();
    return;
  }

  // Mode 3: Full pipeline (discover + ingest)
  if (!wave) {
    console.error(
      "Usage:\n" +
        "  npx tsx scripts/ingest-youtube.ts --wave <1|2|3> [--top N] [--channel name]\n" +
        "  npx tsx scripts/ingest-youtube.ts --video <videoId or URL>\n" +
        "  npx tsx scripts/ingest-youtube.ts --from-discovery <path.json> [--channel name]"
    );
    process.exit(1);
  }

  const waveNum = parseInt(wave);
  let channels = YOUTUBE_CONFIG.channels.filter(
    (c) => c.wave === waveNum && c.channelId
  );

  if (channelFilter) {
    channels = channels.filter((c) =>
      c.name.toLowerCase().includes(channelFilter.toLowerCase())
    );
  }

  if (channels.length === 0) {
    console.log("No channels found for this wave/filter.");
    return;
  }

  console.log(
    `\nYouTube Ingestion — Wave ${wave} (${channels.length} channels, top ${topN})\n`
  );

  const youtube = createYouTubeClient();

  for (const channel of channels) {
    console.log(`\nChannel: ${channel.name}`);

    try {
      // Discover
      console.log(`  Discovering videos...`);
      const videoIds = await fetchChannelVideos(
        youtube,
        channel.channelId,
        channel.maxVideos
      );

      if (videoIds.length === 0) {
        console.log(`  No videos found.`);
        continue;
      }

      console.log(`  Fetching metadata for ${videoIds.length} videos...`);
      const videos = await fetchVideoDetails(youtube, videoIds);

      const selected = scoreAndSelectVideos(
        videos,
        YOUTUBE_CONFIG,
        channel.language,
        topN
      );

      console.log(`  Selected ${selected.length} videos to ingest\n`);

      // Ingest each video
      let channelCount = 0;
      for (const video of selected) {
        if (channelCount >= batchSize) {
          console.log(`  Batch limit reached (${batchSize}). Stopping channel.`);
          break;
        }

        // Check if already ingested
        if (await isVideoIngested(video.videoId)) {
          console.log(`  [skip] Already ingested: ${video.title}`);
          totalSkipped++;
          continue;
        }

        // Fetch transcript
        try {
          console.log(`  [${channelCount + 1}/${selected.length}] ${video.title}`);
          const transcript = await fetchTranscript(
            video.videoId,
            channel.language
          );

          if (!transcript) {
            console.log(`    -> No transcript available`);
            totalNoTranscript++;
            continue;
          }

          // Ingest
          const result = await ingestYouTubeVideo(video, transcript);
          totalProcessed++;
          totalChunks += result.chunkCount;
          channelCount++;
          console.log(`    -> ${result.chunkCount} chunks ingested`);

          // Rate limit between videos
          await sleep(1500);
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes("Too Many Requests")
          ) {
            console.log(
              `    -> Rate limited. Waiting 30 seconds...`
            );
            await sleep(30000);
            // Retry once
            try {
              const transcript = await fetchTranscript(
                video.videoId,
                channel.language
              );
              if (transcript) {
                const result = await ingestYouTubeVideo(video, transcript);
                totalProcessed++;
                totalChunks += result.chunkCount;
                channelCount++;
                console.log(`    -> Retry success: ${result.chunkCount} chunks`);
              }
            } catch {
              totalErrors++;
              console.error(`    -> Retry failed`);
            }
          } else {
            totalErrors++;
            console.error(
              `    -> ERROR: ${error instanceof Error ? error.message : error}`
            );
          }
        }
      }
    } catch (error) {
      console.error(
        `  Channel error: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  printSummary();

  function printSummary() {
    console.log(`\n${"═".repeat(50)}`);
    console.log(`Ingestion complete!`);
    console.log(`  Processed: ${totalProcessed} videos (${totalChunks} chunks)`);
    console.log(`  Skipped (already ingested): ${totalSkipped}`);
    console.log(`  Skipped (no transcript): ${totalNoTranscript}`);
    console.log(`  Errors: ${totalErrors}`);
    console.log(`${"═".repeat(50)}`);
  }

}

function extractVideoId(input: string): string | null {
  // Direct video ID (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }
  // YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getArgValue(
  args: string[],
  flag: string,
  defaultValue: string
): string {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return defaultValue;
  return args[idx + 1];
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
