import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { SYSTEM_PROMPT } from "@/lib/prompts/system-prompt";
import { supabase } from "@/lib/supabase";
import {
  retrieveRelevantChunks,
  formatChunksAsContext,
} from "@/lib/rag/retriever";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // Extract the last user message for RAG retrieval
  const lastUserMessage = messages.findLast((m) => m.role === "user");
  const userQuery =
    lastUserMessage?.parts
      ?.filter(
        (p): p is Extract<typeof p, { type: "text" }> => p.type === "text"
      )
      .map((p) => p.text)
      .join("") || "";

  // RAG: retrieve relevant chunks from knowledge base
  let ragContext = "";
  if (userQuery) {
    try {
      const chunks = await retrieveRelevantChunks(userQuery, {
        matchThreshold: 0.3,
        matchCount: 8,
      });
      ragContext = formatChunksAsContext(chunks);
    } catch (error) {
      console.error("RAG retrieval error:", error);
    }
  }

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: anthropic("claude-sonnet-4-5-20250929"),
    system: SYSTEM_PROMPT + ragContext,
    messages: modelMessages,
    onFinish: async ({ text }) => {
      try {
        if (lastUserMessage && lastUserMessage.role === "user") {
          await supabase.from("ia_marketing_digital").insert({
            role: "user",
            content: userQuery,
          });
        }

        await supabase.from("ia_marketing_digital").insert({
          role: "assistant",
          content: text,
        });
      } catch (error) {
        console.error("Error saving to Supabase:", error);
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
