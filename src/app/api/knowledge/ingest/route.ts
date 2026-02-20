import { NextRequest, NextResponse } from "next/server";
import { ingestPdf } from "@/lib/rag/ingest";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await ingestPdf(buffer, file.name);

    return NextResponse.json({
      success: true,
      documentId: result.documentId,
      chunkCount: result.chunkCount,
    });
  } catch (error) {
    console.error("Ingestion error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Ingestion failed",
      },
      { status: 500 }
    );
  }
}
