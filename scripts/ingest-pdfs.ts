import { readFileSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";
import { config } from "dotenv";

config({ path: join(__dirname, "..", ".env.local") });

async function main() {
  const args = process.argv.slice(2);
  const dir = getArgValue(args, "--dir", "");
  const recursive = args.includes("--recursive");
  const resume = !args.includes("--no-resume"); // resume by default

  if (!dir) {
    console.error(
      "Usage: npx tsx scripts/ingest-pdfs.ts --dir <path> [--recursive] [--no-resume]"
    );
    process.exit(1);
  }

  const targetDir = resolve(dir);

  // Dynamic import after env is loaded
  const { ingestPdf } = await import("../src/lib/rag/ingest");
  const { supabaseAdmin } = await import("../src/lib/supabase-admin");

  // Get existing document titles for resume
  let existingTitles = new Set<string>();
  if (resume) {
    const { data } = await supabaseAdmin
      .from("documents")
      .select("title")
      .eq("source_type", "pdf")
      .eq("status", "completed");

    if (data) {
      existingTitles = new Set(data.map((d: any) => d.title));
    }
  }

  // Find PDF files
  const pdfFiles = findPdfs(targetDir, recursive);

  if (pdfFiles.length === 0) {
    console.log("No PDF files found in:", targetDir);
    return;
  }

  console.log(`\nFound ${pdfFiles.length} PDFs in: ${targetDir}`);
  if (resume) {
    console.log(`Resume mode: will skip already-ingested files`);
  }
  console.log();

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const filePath of pdfFiles) {
    const fileName = filePath.split("/").pop()!;
    const title = fileName.replace(/\.pdf$/i, "");

    // Resume check
    if (resume && existingTitles.has(title)) {
      console.log(`[skip] Already ingested: ${fileName}`);
      skipCount++;
      continue;
    }

    console.log(`Processing: ${fileName}`);
    const buffer = readFileSync(filePath);

    try {
      const result = await ingestPdf(Buffer.from(buffer), fileName);
      console.log(
        `  -> ${result.chunkCount} chunks (ID: ${result.documentId})`
      );
      successCount++;
    } catch (error) {
      console.error(
        `  -> ERROR: ${error instanceof Error ? error.message : error}`
      );
      errorCount++;
    }
  }

  console.log(`\n${"═".repeat(40)}`);
  console.log(`Ingestion complete!`);
  console.log(`  Processed: ${successCount}`);
  console.log(`  Skipped: ${skipCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`${"═".repeat(40)}`);
}

function findPdfs(dir: string, recursive: boolean): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isFile() && entry.toLowerCase().endsWith(".pdf")) {
      files.push(fullPath);
    } else if (stat.isDirectory() && recursive) {
      files.push(...findPdfs(fullPath, true));
    }
  }

  return files.sort();
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
