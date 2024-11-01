import { demoTemplate } from "./demo-template";
import { parseTemplate } from "./generate-logic";
import { getResponseFromOpenAi } from "./demo-llm-warpper";
import { ChatSessionWithTemplate, chatStore } from "./immemory-chat-history";
import { ParsedBlock, UserTrigger, VariableDictionary } from "./types";

export const getTemplate = async (_templateName: string) => {
  const template = await parseTemplate(demoTemplate);
  return template;
};

/**
 * Block executor
 * This function will execute a single block
 */
const getResponseFromLlm = async (
  session: ChatSessionWithTemplate,
  block: ParsedBlock,
  usersVariables?: VariableDictionary
): Promise<string> => {
  // replace all placeholders in all messages
  // to do

  // call the llm
  const response = await getResponseFromOpenAi(block.messages, block.maxTokens);

  return response;
};

/**
 * The main template executor
 * Will iterate over the blocks and execute them
 * All states and variables are stored in the session
 * The actual block index is stored in the session
 * If there is a "callback" it go back to the user. The user can then continue via the ChatId
 */
export const blockLoop = async (
  session: ChatSessionWithTemplate,
  userMessage?: string,
  trigger?: UserTrigger,
  usersVariables?: VariableDictionary
) => {
  const chatId = session.id;
  const template = session.state.useTemplate.def;

  // check if we are in progress inside a template
  const inProgressTemplate = session.state.useTemplate?.blockIndex ?? 0;
  console.log("# Start at block", inProgressTemplate);

  // iterate over blocks
  for (let x = inProgressTemplate; x < template.blocks.length; null) {
    const block = template.blocks[x];

    /**
     * Starting the block
     */
    // clear actual chat if wanted
    if (block.clearOnStart) {
      chatStore.set(chatId, { actualChat: [] });
    }

    // execute functions on start
    if (block.executeOnStart) {
      // to do
    }

    /**
     * Talk to LLM
     */
    const response = await getResponseFromLlm(session, block, usersVariables);
    // set output variables in state
    if (block.outputVariable) {
      chatStore.setVariable(chatId, block.outputVariable, response);
    }
    if (block.memoryVariable) {
      chatStore.appendToMemory(chatId, block.memoryVariable, response);
    }

    /**
     * Ending the block
     */
    // execute functions on end
    if (block.executeOnEnd) {
      // to do
    }

    // clear the history if wanted
    if (block.clearOnEnd) {
      chatStore.set(chatId, { actualChat: [] });
    }

    // What to do next?
    let goOn = true;
    if (block.conditionNext) {
      // call checker function
      // validate the result with the value
      console.log("# Condition next was checked: ", false);
      goOn = false;
    }

    // go to next block or a block defined by name
    if (trigger?.skip) {
      console.log("# User triggered a skip");
      x++;
    } else if ((block.next && goOn) || trigger?.next) {
      console.log("# Go to block", block.next);
      const ix = template.blocks.findIndex((b) => b.name === block.next);
      if (ix !== -1) {
        console.log("# Set index to", ix);
        x = ix;
      }
    } else if (goOn) {
      console.log("# Go to next block. auto-increment");
      x++;
    } else {
      console.log("# Loop this block!");
    }
  }
};

type UserQuery = {
  chatId?: string;
  userMessage?: string;
  templateName?: string;
  trigger?: UserTrigger;
  usersVariables?: VariableDictionary;
};

/**
 * The main function called from the UI
 * This can START or CONTINUE a chat
 * That depends on the given data and if the chatId already exists
 */
export const initChatFromUi = async (data: UserQuery) => {
  let session = data.chatId ? chatStore.get(data.chatId) : null;

  if (!session && data.templateName) {
    const template = await getTemplate(data.templateName);
    session = chatStore.create(template);
  } else if (!session) {
    session = chatStore.create();
  }

  if (session.state.useTemplate) {
    const result = await blockLoop(
      session as ChatSessionWithTemplate,
      data.userMessage,
      data.trigger,
      data.usersVariables
    );

    console.log(
      session.state.memories,
      session.state.variables,
      session.state.useTemplate.blockIndex
    );

    return { chatId: session.id, result };
  } else {
    throw new Error("Chat without template not supported");
  }
};

// start a new chat with the demo template
initChatFromUi({
  templateName: "demo",
})
  .then((result) => {
    console.log("Chat ended with id", result.chatId);
    console.log("Result", result.result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error starting chat", error);
    process.exit(1);
  });
