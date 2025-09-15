import { OpenAiMessages } from "../types/type";

const MODEL = "gpt-4.1-2025-04-14";
const MAX_COMPLETION_TOKENS = 1000;
const OPEN_AI_URL = "https://api.openai.com/v1/chat/completions";

export const callOpenAi = async ({
  messages,
  apiUrl = OPEN_AI_URL,
}: {
  messages: OpenAiMessages[];
  apiUrl?: string;
}) => {
  const API_KEY = process.env.OPENAI_API_KEY;

  if (!API_KEY) throw new Error("OPEN_AI_KEY is missing");

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: messages,
      max_completion_tokens: MAX_COMPLETION_TOKENS,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
};
