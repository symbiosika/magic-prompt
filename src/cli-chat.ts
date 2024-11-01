import readline from "readline";
import { initChatFromUi } from "./iterator";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function startChat() {
  try {
    console.log("Starting new chat...");

    // Start initial chat
    let chatResponse = await initChatFromUi({
      templateName: "demo",
    });

    let chatId = chatResponse.chatId;

    // Continue chat until finished
    while (!chatResponse.result.finished) {
      console.log("\nAI:", chatResponse.result.message.content);

      if (chatResponse.result.meta.variables) {
        // Get user input if variables are requested
        const userInput = await new Promise<string>((resolve) => {
          rl.question("You: ", resolve);
        });

        // Continue chat with user input
        chatResponse = await initChatFromUi({
          chatId: chatId,
          userMessage: userInput,
          // trigger: { next: true },
        });
      }
    }

    // Show final result
    console.log("\nFinal Response:", chatResponse.result.message.content);
    rl.close();
  } catch (error) {
    console.error("Error:", error);
    rl.close();
  }
}

// Start the chat
startChat();
