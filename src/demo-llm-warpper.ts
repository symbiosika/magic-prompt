import OpenAI from "openai";
import { ChatMessage, TemplateChatLogger } from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const getResponseFromOpenAi = async (
  messages: ChatMessage[],
  maxTokens?: number,
  logger?: TemplateChatLogger
): Promise<string> => {
  await logger?.debug?.("magic-prompt: LLM call", messages);
  const completion = await openai.chat.completions.create({
    messages: messages as any,
    model: "gpt-4-turbo",
    max_tokens: maxTokens,
  });

  const response = completion.choices[0].message.content ?? "";
  return response;
};
