import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateEmbedding } from "./embeddings";

export interface RetrievedChunk {
  id: string;
  content: string;
  similarity: number;
  documentTitle: string;
  sourceType: string;
  pageNumber: number | null;
  sectionTitle: string | null;
}

export async function retrieveRelevantChunks(
  query: string,
  options: {
    matchThreshold?: number;
    matchCount?: number;
  } = {}
): Promise<RetrievedChunk[]> {
  const { matchThreshold = 0.3, matchCount = 8 } = options;

  const queryEmbedding = await generateEmbedding(query);

  const { data, error } = await supabaseAdmin.rpc("match_chunks", {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    console.error("Error retrieving chunks:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    content: row.content,
    similarity: row.similarity,
    documentTitle: row.document_title,
    sourceType: row.source_type,
    pageNumber: row.page_number,
    sectionTitle: row.section_title,
  }));
}

export function formatChunksAsContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "";

  const contextBlocks = chunks.map((chunk, i) => {
    const source = chunk.sectionTitle
      ? `${chunk.documentTitle} > ${chunk.sectionTitle}`
      : chunk.documentTitle;
    const location = chunk.pageNumber
      ? ` (p.${chunk.pageNumber})`
      : chunk.sectionTitle?.startsWith("[")
        ? ` ${chunk.sectionTitle}`
        : "";

    return `[Fonte ${i + 1}: ${source}${location} | Relevância: ${(chunk.similarity * 100).toFixed(0)}%]\n${chunk.content}`;
  });

  return `\n\n## CONTEXTO DA BASE DE CONHECIMENTO\n\nUse o conteúdo abaixo como referência para responder. Cite as fontes quando usar informações específicas. Se o contexto não for relevante para a pergunta, ignore-o e responda normalmente.\n\n${contextBlocks.join("\n\n---\n\n")}`;
}
