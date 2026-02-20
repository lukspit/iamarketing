import { supabaseAdmin } from "@/lib/supabase-admin";
import { parsePdf } from "./pdf-parser";
import { chunkDocument } from "./chunker";
import { generateEmbeddings } from "./embeddings";

export async function ingestPdf(
  buffer: Buffer,
  fileName: string
): Promise<{ documentId: string; chunkCount: number }> {
  const { data: doc, error: docError } = await supabaseAdmin
    .from("documents")
    .insert({
      title: fileName.replace(/\.pdf$/i, ""),
      source_type: "pdf",
      file_name: fileName,
      file_size: buffer.length,
      status: "processing",
    })
    .select("id")
    .single();

  if (docError || !doc) {
    throw new Error(`Failed to create document: ${docError?.message}`);
  }

  const documentId = doc.id;

  try {
    const parsed = await parsePdf(buffer, fileName);
    const chunks = chunkDocument(parsed.pages);

    if (chunks.length === 0) {
      throw new Error("No text content extracted from PDF");
    }

    const embeddings = await generateEmbeddings(
      chunks.map((c) => c.content)
    );

    const BATCH_SIZE = 50;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE);
      const batchEmbeddings = embeddings.slice(i, i + BATCH_SIZE);

      const chunkRows = batchChunks.map((chunk, j) => ({
        document_id: documentId,
        content: chunk.content,
        chunk_index: chunk.chunkIndex,
        page_number: chunk.pageNumber,
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

    await supabaseAdmin
      .from("documents")
      .update({
        status: "completed",
        total_chunks: chunks.length,
        metadata: {
          total_pages: parsed.totalPages,
          total_tokens: chunks.reduce((sum, c) => sum + c.tokenCount, 0),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    return { documentId, chunkCount: chunks.length };
  } catch (error) {
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
