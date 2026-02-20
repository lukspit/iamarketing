import OpenAI from "openai";

function createOpenAIClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null as any;
  return new OpenAI({ apiKey: key });
}

export const openai = createOpenAIClient();
