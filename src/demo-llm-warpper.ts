import OpenAI from "openai";
import { ChatMessage, LlmWrapper, TemplateChatLogger } from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const getResponseFromOpenAi: LlmWrapper = async (
  messages: ChatMessage[],
  options?: {
    maxTokens?: number;
    model?: string;
    temperature?: number;
    outputType?: "text" | "json";
  },
  logger?: TemplateChatLogger
): Promise<string> => {
  await logger?.debug?.("magic-prompt: LLM call", messages);
  const completion = await openai.chat.completions.create({
    messages: messages as any,
    model: options?.model ?? "gpt-4-turbo",
    max_tokens: options?.maxTokens ?? 500,
    temperature: options?.temperature ?? 0.5,
  });

  const response = completion.choices[0].message.content ?? "";
  return response;
};
