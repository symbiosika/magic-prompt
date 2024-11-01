import OpenAI from "openai";
import { nanoid } from "nanoid";
import { ChatMessage } from "./immemory-chat-history";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const getResponseFromOpenAi = async (
  messages: ChatMessage[],
  maxTokens?: number
): Promise<string> => {
  console.log("chat with LLM", messages);
  // wait 2 seconds
  await new Promise((resolve) => setTimeout(resolve, 3000));
  return "return from LLM " + nanoid(16);

  const completion = await openai.chat.completions.create({
    messages: messages as any,
    model: "gpt-4-turbo",
    max_tokens: maxTokens,
  });

  const response = completion.choices[0].message.content ?? "";
  return response;
};
