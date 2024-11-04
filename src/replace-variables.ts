import {
  ChatMessage,
  PlaceholderParser,
  TemplateChatLogger,
  VariableDictionaryInMemory,
} from "./types";
import { parseArgumentsWithoutLimits } from "./parse-arguments";

/**
 * Find all variables {{var_name}} and replace them with the actual value
 */
export const replaceVariables = async (
  messages: ChatMessage[],
  variables: VariableDictionaryInMemory,
  logger?: TemplateChatLogger
) => {
  const replacedMessages: ChatMessage[] = [];
  for (const message of messages) {
    let replacedMessage = JSON.parse(JSON.stringify(message));
    const matches = replacedMessage.content.match(/{{\s*(\w+)\s*}}/g);

    if (matches) {
      for (const match of matches) {
        const variableName = match.replace(/{{\s*(\w+)\s*}}/, "$1");
        const value = variables[variableName];

        if (value) {
          const returnValue = Array.isArray(value)
            ? value.map((v) => `"${v}"`).join("\n\n")
            : value;
          await logger?.debug?.(
            `magic-prompt:  Replacing "${match}" with "${returnValue}"`
          );
          replacedMessage.content = replacedMessage.content.replace(
            match,
            returnValue
          );
        } else {
          await logger?.debug?.(`magic-prompt:  No replacement for "${match}"`);
        }
      }
    }

    replacedMessages.push(replacedMessage);
  }
  return replacedMessages;
};

/**
 * Find all custom placeholders like {{#custom ...}} and replace them
 */
export const replaceCustomPlaceholders = async (
  messages: ChatMessage[],
  parsers: PlaceholderParser[],
  variables: VariableDictionaryInMemory,
  logger?: TemplateChatLogger
) => {
  const replacedMessages: ChatMessage[] = [];
  // await logger?.debug?.(
  //   `magic-prompt: Replacing custom placeholders. Using ${parsers.length} parsers`
  // );
  let skipThisBlock = false;

  for (const message of messages) {
    let replacedMessage = JSON.parse(JSON.stringify(message));

    for (const parser of parsers) {
      //await logger?.debug?.(`magic-prompt: Trying to replace ${parser.name}`);
      if (!parser.expression) {
        parser.expression = new RegExp(`{{#${parser.name}([^}]*?)}}`, "g");
      }

      const matches = replacedMessage.content.match(parser.expression);
      if (matches) {
        //await logger?.debug?.(`magic-prompt: Found ${matches.length} matches`);
        // Process all matches sequentially
        for (const match of matches) {
          const args = parseArgumentsWithoutLimits(match, parser.name);
          const replacement = await parser.replacerFunction(
            match,
            args,
            variables
          );
          skipThisBlock = replacement.skipThisBlock ?? false;
          replacedMessage.content = replacedMessage.content.replace(
            match,
            replacement.content
          );
        }
      }
    }
    replacedMessages.push(replacedMessage);
  }
  return {
    replacedMessages,
    skipThisBlock,
  };
};
