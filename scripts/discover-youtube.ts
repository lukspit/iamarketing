import { config } from "dotenv";
import { join } from "path";
import { writeFileSync, mkdirSync, existsSync } from "fs";

config({ path: join(__dirname, "..", ".env.local") });

async function main() {
  const args = process.argv.slice(2);
  const wave = getArgValue(args, "--wave", "1");
  const topN = parseInt(getArgValue(args, "--top", "10"));
  const dryRun = args.includes("--dry-run");
  const resolveChannel = getArgValue(args, "--resolve-channel", "");
  const channelFilter = getArgValue(args, "--channel", "");

  // Dynamic imports after env is loaded
  const { createYouTubeClient, resolveChannelId, fetchChannelVideos, fetchVideoDetails } =
    await import("../src/lib/youtube/youtube-api");
  const { scoreAndSelectVideos } = await import("../src/lib/youtube/scorer");
  const { YOUTUBE_CONFIG } = await import("../src/lib/youtube/config");

  const youtube = createYouTubeClient();

  // Utility: resolve a channel handle/URL to ID
  if (resolveChannel) {
    console.log(`\nResolving channel: ${resolveChannel}`);
    const info = await resolveChannelId(youtube, resolveChannel);
    if (info) {
      console.log(`  Channel ID: ${info.channelId}`);
      console.log(`  Title: ${info.title}`);
      console.log(`  Subscribers: ${info.subscriberCount.toLocaleString()}`);
      console.log(`  Videos: ${info.videoCount.toLocaleString()}`);
    } else {
      console.log("  Channel not found.");
    }
    return;
  }

  // Filter channels by wave and optional name filter
  const waveNum = parseInt(wave);
  let channels = YOUTUBE_CONFIG.channels.filter((c) => c.wave === waveNum);

  if (channelFilter) {
    channels = channels.filter((c) =>
      c.name.toLowerCase().includes(channelFilter.toLowerCase())
    );
  }

  // Skip channels without channel IDs
  const readyChannels = channels.filter((c) => c.channelId);
  const skippedChannels = channels.filter((c) => !c.channelId);

  if (skippedChannels.length > 0) {
    console.log(`\nSkipping ${skippedChannels.length} channels without IDs:`);
    for (const c of skippedChannels) {
      console.log(`  - ${c.name} (handle: ${c.handle}) — run --resolve-channel ${c.handle} to get ID`);
    }
  }

  if (readyChannels.length === 0) {
    console.log("\nNo channels ready for discovery. Add channel IDs to config.ts first.");
    console.log("Use --resolve-channel <handle> to look up IDs.");
    return;
  }

  console.log(
    `\nDiscovering videos for Wave ${wave} (${readyChannels.length} channels, top ${topN} per channel)${dryRun ? " [DRY RUN]" : ""}\n`
  );

  const discoveryResults: any[] = [];

  for (const channel of readyChannels) {
    console.log(`\nChannel: ${channel.name}`);
    console.log(`  Fetching videos...`);

    try {
      const videoIds = await fetchChannelVideos(
        youtube,
        channel.channelId,
        channel.maxVideos
      );
      console.log(`  Found ${videoIds.length} videos`);

      if (videoIds.length === 0) {
        discoveryResults.push({
          channelName: channel.name,
          channelId: channel.channelId,
          totalFetched: 0,
          selectedVideos: [],
        });
        continue;
      }

      console.log(`  Fetching metadata...`);
      const videos = await fetchVideoDetails(youtube, videoIds);

      console.log(`  Scoring and selecting top ${topN}...`);
      const selected = scoreAndSelectVideos(
        videos,
        YOUTUBE_CONFIG,
        channel.language,
        topN
      );

      discoveryResults.push({
        channelName: channel.name,
        channelId: channel.channelId,
        totalFetched: videos.length,
        selectedVideos: selected,
      });

      // Print table
      console.log(
        `  Selected ${selected.length} videos:\n`
      );
      console.log(
        `  ${"#".padEnd(4)} ${"Score".padEnd(7)} ${"Views".padEnd(12)} ${"Date".padEnd(12)} Title`
      );
      console.log(`  ${"─".repeat(80)}`);

      for (let i = 0; i < selected.length; i++) {
        const v = selected[i];
        const views = v.viewCount >= 1_000_000
          ? `${(v.viewCount / 1_000_000).toFixed(1)}M`
          : v.viewCount >= 1_000
            ? `${(v.viewCount / 1_000).toFixed(0)}K`
            : `${v.viewCount}`;
        const date = v.publishedAt.slice(0, 10);
        const title = v.title.length > 50 ? v.title.slice(0, 47) + "..." : v.title;

        console.log(
          `  ${(i + 1).toString().padEnd(4)} ${v.score.toFixed(3).padEnd(7)} ${views.padEnd(12)} ${date.padEnd(12)} ${title}`
        );
      }
    } catch (error) {
      console.error(
        `  ERROR: ${error instanceof Error ? error.message : error}`
      );
      discoveryResults.push({
        channelName: channel.name,
        channelId: channel.channelId,
        totalFetched: 0,
        selectedVideos: [],
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Save results
  if (!dryRun && discoveryResults.some((r) => r.selectedVideos.length > 0)) {
    const dataDir = join(__dirname, "data");
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    const output = {
      discoveredAt: new Date().toISOString(),
      wave: waveNum,
      topNPerChannel: topN,
      channels: discoveryResults,
    };

    const outputPath = join(dataDir, `discovered-wave${wave}.json`);
    writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\nResults saved to: ${outputPath}`);
  }

  // Summary
  const totalSelected = discoveryResults.reduce(
    (sum, r) => sum + r.selectedVideos.length,
    0
  );
  const totalFetched = discoveryResults.reduce(
    (sum, r) => sum + r.totalFetched,
    0
  );
  console.log(`\nDiscovery complete!`);
  console.log(`  Channels processed: ${readyChannels.length}`);
  console.log(`  Total videos fetched: ${totalFetched}`);
  console.log(`  Total videos selected: ${totalSelected}`);
}

function getArgValue(args: string[], flag: string, defaultValue: string): string {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return defaultValue;
  return args[idx + 1];
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
