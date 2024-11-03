import { chatStore } from "./immemory-chat-history";
import {
  ChatSessionWithTemplate,
  LlmWrapper,
  ParsedBlock,
  PlaceholderParser,
  TemplateChatLogger,
  UserChatQuery,
  UserChatResponse,
  UserTrigger,
  VariableDictionary,
} from "./types";
import {
  replaceCustomPlaceholders,
  replaceVariables,
} from "./replace-variables";

/**
 * Block executor
 * This function will execute a single block
 */
const getResponseFromLlm = async (
  session: ChatSessionWithTemplate,
  block: ParsedBlock,
  llmWrapper: LlmWrapper,
  logger: TemplateChatLogger | undefined,
  placeholderParsers: PlaceholderParser[]
): Promise<string> => {
  // replace all placeholders in all messages
  let replacedBlockMessages = await replaceVariables(
    block.messages,
    session.state.variables,
    logger
  );
  replacedBlockMessages = await replaceCustomPlaceholders(
    replacedBlockMessages,
    placeholderParsers,
    logger
  );

  // Combine actualChat with block messages
  const allMessages = [...(session.actualChat ?? []), ...replacedBlockMessages];
  await logger?.debug?.(
    "magic-prompt: messages",
    allMessages.map((m) => `${m.role}: "${m.content}"`)
  );

  // call the llm
  const response = await llmWrapper(allMessages, block.maxTokens);
  allMessages.push({ role: "assistant", content: response });

  // save all messages to actualChat
  chatStore.set(session.id, { appendToHistory: replacedBlockMessages });
  chatStore.set(session.id, { actualChat: allMessages });

  await logger?.debug?.("magic-prompt: LLM response", response);
  return response;
};

/**
 * A helper to exetute a function
 */
const executeFunction = async (
  session: ChatSessionWithTemplate,
  functionName: string,
  llmWrapper: LlmWrapper,
  logger: TemplateChatLogger | undefined,
  placeholderParsers: PlaceholderParser[]
) => {
  const func = session.state.useTemplate.def.functions[functionName];
  if (func) {
    await logger?.debug?.("magic-prompt: Execute function", functionName);
    const response = await getResponseFromLlm(
      session,
      func,
      llmWrapper,
      logger,
      placeholderParsers
    );
    await logger?.debug?.(
      "magic-prompt:  LLM Function response",
      response,
      `Set variable ${func.outputVariable} with value`
    );
    chatStore.setVariable(session.id, func.outputVariable, response);
    if (func.memoryVariable) {
      chatStore.appendToMemory(session.id, func.memoryVariable, response);
      await logger?.debug?.(
        `magic-prompt:  Actual memory state for ${func.memoryVariable}`,
        session.state.variables[func.memoryVariable]
      );
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
  llmWrapper: LlmWrapper,
  userMessage: string | undefined,
  trigger: UserTrigger | undefined,
  usersVariables: VariableDictionary | undefined,
  logger: TemplateChatLogger | undefined,
  placeholderParsers: PlaceholderParser[]
) => {
  const chatId = session.id;
  const template = session.state.useTemplate.def;

  // merge the sessions variables with the users variables
  chatStore.mergeVariables(chatId, usersVariables ?? {});
  if (userMessage) {
    chatStore.setVariable(chatId, "users_input", userMessage);
  }

  // check if we are in progress inside a template
  const inProgressTemplate = session.state.useTemplate?.blockIndex ?? 0;
  await logger?.debug?.("magic-prompt: Start at block", inProgressTemplate);

  let lastResponse: null | string = null;

  // log a list of all blocks. only log the name
  await logger?.debug?.(
    "magic-prompt:  All blocks",
    template.blocks.map((b) => b.name)
  );

  // iterate over blocks
  for (let x = inProgressTemplate; x < template.blocks.length; null) {
    // set state
    chatStore.set(chatId, { blockIndex: x });
    await logger?.debug?.("magic-prompt: Set state to", x);

    // get the block
    const block = template.blocks[x];
    await logger?.debug?.("magic-prompt: Execute block", block.name);

    /**
     * Check if we have a setter
     */
    if (block.setter) {
      await logger?.debug?.(
        "magic-prompt: Set variables",
        block.setter.variables
      );
      chatStore.mergeVariables(chatId, block.setter.variables);
      x++;
      continue;
    }

    /**
     * Check if we have a callback
     */
    if (block.callback) {
      await logger?.debug?.("magic-prompt: triggered a callback");
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
      await logger?.debug?.(
        "magic-prompt:  Execute functions on start",
        block.executeOnStart
      );
      for (const funcName of block.executeOnStart) {
        await executeFunction(
          session,
          funcName,
          llmWrapper,
          logger,
          placeholderParsers
        );
      }
    }

    /**
     * Talk to LLM
     */
    const response = await getResponseFromLlm(
      session,
      block,
      llmWrapper,
      logger,
      placeholderParsers
    );
    // set output variables in state
    if (block.outputVariable) {
      chatStore.setVariable(chatId, block.outputVariable, response);
    }
    if (block.memoryVariable) {
      chatStore.appendToMemory(chatId, block.memoryVariable, response);
    }
    lastResponse = response;

    /**
     * Ending the block
     */
    // execute functions on end
    if (block.executeOnEnd) {
      await logger?.debug?.(
        "magic-prompt: Execute functions on end",
        block.executeOnEnd
      );
      for (const funcName of block.executeOnEnd) {
        await executeFunction(
          session,
          funcName,
          llmWrapper,
          logger,
          placeholderParsers
        );
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
      await logger?.debug?.(
        "magic-prompt: Condition next was checked: ",
        false
      );
      goOn = false;
    }
    if (block.allowOpenChat && !trigger?.skip && !trigger?.next) {
      await logger?.debug?.("magic-prompt: open chat. iterate itself");
      // callback to user here
      return <UserChatResponse>{
        chatId,
        message: {
          role: "assistant",
          content: response,
        },
        meta: {
          variables: ["users_input"],
        },
        finished: false,
      };
    }

    // go to next block or a block defined by name
    if (trigger?.skip) {
      await logger?.debug?.("magic-prompt: User triggered a skip");
      x++;
    } else if ((block.next && goOn) || trigger?.next) {
      await logger?.debug?.("magic-prompt: Go to block", block.next);
      const ix = template.blocks.findIndex((b) => b.name === block.next);
      if (ix !== -1) {
        await logger?.debug?.("magic-prompt: Set index to", ix);
        x = ix;
      }
    } else if (goOn) {
      await logger?.debug?.("magic-prompt: Go to next block. auto-increment");
      x++;
    } else {
      await logger?.debug?.("magic-prompt: Loop this block!");
    }
  }

  // the loop is finished. return the last response
  await logger?.debug?.("magic-prompt: Loop is finished. Return last response");
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
  llmWrapper: LlmWrapper,
  logger: TemplateChatLogger | undefined,
  placeholderParsers: PlaceholderParser[]
): Promise<{
  chatId: string;
  result: UserChatResponse;
}> {
  await logger?.debug?.("magic-prompt: Starting chat initialization", data);
  let session = data.chatId ? chatStore.get(data.chatId) : null;

  if (!session && data.template) {
    await logger?.debug?.("magic-prompt: Template loaded. Create session");
    session = chatStore.create({
      useTemplate: data.template,
      chatId: data.chatId && data.chatId.length > 0 ? data.chatId : undefined,
    });
  } else if (!session) {
    await logger?.debug?.(
      "magic-prompt: No session found. Create new session without template"
    );
    session = chatStore.create({
      chatId: data.chatId && data.chatId.length > 0 ? data.chatId : undefined,
    });
  }

  if (session.state.useTemplate) {
    await logger?.debug?.("magic-prompt: Session with template found.");
    const result = await blockLoop(
      session as ChatSessionWithTemplate,
      llmWrapper,
      data.userMessage,
      data.trigger,
      data.usersVariables,
      logger,
      placeholderParsers
    );

    return { chatId: session.id, result };
  } else {
    throw new Error("Chat without template not supported");
  }
}
