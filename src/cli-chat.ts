import readline from "readline";
import { promises as fsPromises } from "fs";
import { TemplateChat } from "./template-chat-class";
import { standardSingleLineParsers } from "./standard-parsers";
import { standardPlaceholderParsers } from "./standard-parsers";
import { TemplateChatLogger } from "./types";
import { getResponseFromOpenAi } from "./demo-llm-warpper";

const parseTrigger = (input: string): { next: boolean; skip: boolean } => {
  const trigger = { next: false, skip: false };
  if (input.toLowerCase().includes("skip")) trigger.skip = true;
  if (input.toLowerCase().includes("next")) trigger.next = true;
  return trigger;
};

const log = async (...items: any[]): Promise<void> => {
  const formattedMessage =
    items
      .map((msg) =>
        typeof msg === "object" ? JSON.stringify(msg, null, 2) : String(msg)
      )
      .join(" ") + "\n";
  await fsPromises.appendFile("chat.log", formattedMessage);
};

const appendToLog: TemplateChatLogger = {
  debug: log,
  info: log,
  error: log,
};

const templateChat = new TemplateChat({
  singleLineParsers: standardSingleLineParsers,
  placeholderParsers: standardPlaceholderParsers,
  llmWrapper: getResponseFromOpenAi,
  logger: appendToLog,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function startChat() {
  try {
    console.clear();
    console.log("Starting new chat...");
    // clear the log file
    await fsPromises.writeFile("chat.log", "");

    // Start initial chat
    let chatResponse = await templateChat.chat({
      templateName: "demo",
    });

    let chatId = chatResponse.chatId;

    // Continue chat until finished
    while (!chatResponse.result.finished) {
      console.log("\nAI:", chatResponse.result.message.content);

      if (chatResponse.result.meta.variables) {
        console.clear();
        console.log("AI:", chatResponse.result.message.content);

        // Get user input if variables are requested
        const userInput = await new Promise<string>((resolve) => {
          rl.question("You: ", resolve);
        });

        // parse if the user is using a trigger word "skip" or "next"
        const trigger = parseTrigger(userInput);

        // Continue chat with user input
        chatResponse = await templateChat.chat({
          chatId: chatId,
          userMessage: userInput,
          trigger,
        });
      }
    }

    // Show final result
    console.clear();
    console.log("\nFinal Response:", chatResponse.result.message.content);
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    rl.close();
    process.exit(1);
  }
}

// Start the chat
startChat();
