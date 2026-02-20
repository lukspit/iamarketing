import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateEmbeddings } from "../rag/embeddings";
import { chunkTranscript } from "./transcript-chunker";
import { FetchedTranscript } from "./transcript";
import { VideoMetadata } from "./youtube-api";

export interface YouTubeIngestResult {
  documentId: string;
  chunkCount: number;
  videoId: string;
  title: string;
}

export async function isVideoIngested(videoId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("documents")
    .select("id")
    .eq("source_type", "youtube")
    .eq("status", "completed")
    .filter("metadata->>video_id", "eq", videoId)
    .limit(1);

  return (data?.length ?? 0) > 0;
}

export async function ingestYouTubeVideo(
  video: VideoMetadata,
  transcript: FetchedTranscript
): Promise<YouTubeIngestResult> {
  // Create document record
  const { data: doc, error: docError } = await supabaseAdmin
    .from("documents")
    .insert({
      title: `${video.title} - ${video.channelTitle}`,
      source_type: "youtube",
      file_name: null,
      file_size: null,
      status: "processing",
      metadata: {
        video_id: video.videoId,
        channel_id: video.channelId,
        channel_name: video.channelTitle,
        video_url: video.videoUrl,
        views: video.viewCount,
        likes: video.likeCount,
        published_at: video.publishedAt,
        duration_seconds: video.durationSeconds,
        transcript_language: transcript.language,
        thumbnail_url: video.thumbnailUrl,
      },
    })
    .select("id")
    .single();

  if (docError || !doc) {
    throw new Error(`Failed to create document: ${docError?.message}`);
  }

  const documentId = doc.id;

  try {
    // Chunk the transcript
    const chunks = chunkTranscript(transcript.segments);

    if (chunks.length === 0) {
      throw new Error("No content extracted from transcript");
    }

    // Generate embeddings (reuses existing pipeline)
    const embeddings = await generateEmbeddings(
      chunks.map((c) => c.content)
    );

    // Insert chunks in batches (same pattern as PDF ingest)
    const BATCH_SIZE = 50;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE);
      const batchEmbeddings = embeddings.slice(i, i + BATCH_SIZE);

      const chunkRows = batchChunks.map((chunk, j) => ({
        document_id: documentId,
        content: chunk.content,
        chunk_index: chunk.chunkIndex,
        page_number: null,
        section_title: chunk.sectionTitle,
        token_count: chunk.tokenCount,
        embedding: JSON.stringify(batchEmbeddings[j]),
      }));

      const { error: insertError } = await supabaseAdmin
        .from("chunks")
        .insert(chunkRows);

      if (insertError) {
        throw new Error(`Failed to insert chunks: ${insertError.message}`);
      }
    }

    // Mark as completed
    await supabaseAdmin
      .from("documents")
      .update({
        status: "completed",
        total_chunks: chunks.length,
        metadata: {
          video_id: video.videoId,
          channel_id: video.channelId,
          channel_name: video.channelTitle,
          video_url: video.videoUrl,
          views: video.viewCount,
          likes: video.likeCount,
          published_at: video.publishedAt,
          duration_seconds: video.durationSeconds,
          transcript_language: transcript.language,
          thumbnail_url: video.thumbnailUrl,
          total_tokens: chunks.reduce((sum, c) => sum + c.tokenCount, 0),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    return {
      documentId,
      chunkCount: chunks.length,
      videoId: video.videoId,
      title: video.title,
    };
  } catch (error) {
    // Mark as error (same pattern as PDF ingest)
    await supabaseAdmin
      .from("documents")
      .update({
        status: "error",
        error_message:
          error instanceof Error ? error.message : "Unknown error",
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    throw error;
  }
}
