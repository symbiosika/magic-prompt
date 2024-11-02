import { demoTemplate } from "./demo-template";
import { parseTemplate } from "./generate-logic";
import { getResponseFromOpenAi } from "./demo-llm-warpper";
import { ChatSessionWithTemplate, chatStore } from "./immemory-chat-history";
import {
  ParsedBlock,
  TemplateChatLogger,
  UserChatQuery,
  UserChatResponse,
  UserTrigger,
  VariableDictionary,
} from "./types";

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
  usersVariables?: VariableDictionary,
  logger?: TemplateChatLogger
): Promise<string> => {
  // replace all placeholders in all messages
  // to do

  // call the llm
  const response = await getResponseFromOpenAi(block.messages, block.maxTokens);

  return response;
};

/**
 * A helper to exetute a function
 */
const executeFunction = async (
  session: ChatSessionWithTemplate,
  functionName: string,
  logger?: TemplateChatLogger
) => {
  const func = session.state.useTemplate.def.functions[functionName];
  if (func) {
    const response = await getResponseFromOpenAi(func.messages);
    chatStore.setVariable(session.id, func.outputVariable, response);
    if (func.memoryVariable) {
      chatStore.appendToMemory(session.id, func.memoryVariable, response);
    }
  }
  return null;
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
  usersVariables?: VariableDictionary,
  logger?: TemplateChatLogger
) => {
  const chatId = session.id;
  const template = session.state.useTemplate.def;

  // check if we are in progress inside a template
  const inProgressTemplate = session.state.useTemplate?.blockIndex ?? 0;
  await logger?.("# Start at block", inProgressTemplate);

  let lastResponse: null | string = null;

  // log a list of all blocks. only log the name
  await logger?.(
    "# All blocks",
    template.blocks.map((b) => b.name)
  );

  // iterate over blocks
  for (let x = inProgressTemplate; x < template.blocks.length; null) {
    // set state
    chatStore.set(chatId, { blockIndex: x });
    await logger?.("# Set state to", x);

    // get the block
    const block = template.blocks[x];
    await logger?.("# Execute block", block.name);

    /**
     * Check if we have a callback
     */
    if (block.callback) {
      await logger?.("# triggered a callback");
      // set the pointer to the next block!
      chatStore.set(chatId, { blockIndex: x + 1 });
      return <UserChatResponse>{
        chatId,
        message: {
          role: "assistant",
          content: block.callback.contentVariable
            ? chatStore.getVariable(chatId, block.callback.contentVariable)
            : "",
        },
        meta: {
          variables: block.callback.returnVariables,
        },
        finished: false,
      };
    }

    /**
     * Starting the block
     */
    // clear actual chat if wanted
    if (block.clearOnStart) {
      chatStore.set(chatId, { actualChat: [] });
    }

    // execute functions on start
    if (block.executeOnStart) {
      for (const funcName of block.executeOnStart) {
        await executeFunction(session, funcName, logger);
      }
    }

    /**
     * Talk to LLM
     */
    const response = await getResponseFromLlm(
      session,
      block,
      usersVariables,
      logger
    );
    lastResponse = response;
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
      for (const funcName of block.executeOnEnd) {
        await executeFunction(session, funcName, logger);
      }
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
      await logger?.("# Condition next was checked: ", false);
      goOn = false;
    }

    // go to next block or a block defined by name
    if (trigger?.skip) {
      await logger?.("# User triggered a skip");
      x++;
    } else if ((block.next && goOn) || trigger?.next) {
      await logger?.("# Go to block", block.next);
      const ix = template.blocks.findIndex((b) => b.name === block.next);
      if (ix !== -1) {
        await logger?.("# Set index to", ix);
        x = ix;
      }
    } else if (goOn) {
      await logger?.("# Go to next block. auto-increment");
      x++;
    } else {
      await logger?.("# Loop this block!");
    }
  }

  // the loop is finished. return the last response
  await logger?.("# Loop is finished. Return last response");
  return <UserChatResponse>{
    chatId,
    message: {
      role: "assistant",
      content: lastResponse,
    },
    meta: {},
    finished: true,
  };
};

/**
 * The main function called from the UI
 * This can START or CONTINUE a chat
 * That depends on the given data and if the chatId already exists
 */
export async function initChatFromUi(
  data: UserChatQuery,
  logger?: TemplateChatLogger
): Promise<{
  chatId: string;
  result: UserChatResponse;
}> {
  await logger?.("Starting chat initialization", data);
  let session = data.chatId ? chatStore.get(data.chatId) : null;

  if (!session && data.templateName) {
    const template = await getTemplate(data.templateName);
    await logger?.("Template loaded. Create session");
    session = chatStore.create(template);
  } else if (!session) {
    await logger?.("No session found. Create new session without template");
    session = chatStore.create();
  }

  if (session.state.useTemplate) {
    await logger?.("Session with template found.");
    const result = await blockLoop(
      session as ChatSessionWithTemplate,
      data.userMessage,
      data.trigger,
      data.usersVariables,
      logger
    );

    // await logger?.(
    //   session.state.memories,
    //   session.state.variables,
    //   session.state.useTemplate.blockIndex
    // );

    return { chatId: session.id, result };
  } else {
    throw new Error("Chat without template not supported");
  }
}
