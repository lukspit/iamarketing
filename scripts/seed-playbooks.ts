import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

config({ path: join(__dirname, "..", ".env.local") });

// Set up env manually for the OpenAI and Supabase clients
const PLAYBOOKS_DIR = "/Users/lucaspit/IA marketing digital/playbooks hormozi";

async function main() {
  // Dynamic import after env is loaded
  const { ingestPdf } = await import("../src/lib/rag/ingest");

  const files = readdirSync(PLAYBOOKS_DIR)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .sort();

  console.log(`\n📚 Found ${files.length} PDFs to ingest:\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const fileName of files) {
    console.log(`📄 Processing: ${fileName}`);
    const filePath = join(PLAYBOOKS_DIR, fileName);
    const buffer = readFileSync(filePath);

    try {
      const result = await ingestPdf(Buffer.from(buffer), fileName);
      console.log(
        `   ✅ Done: ${result.chunkCount} chunks (ID: ${result.documentId})\n`
      );
      successCount++;
    } catch (error) {
      console.error(
        `   ❌ ERROR: ${error instanceof Error ? error.message : error}\n`
      );
      errorCount++;
    }
  }

  console.log(`\n🏁 Seeding complete!`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
}

main().catch(console.error);
