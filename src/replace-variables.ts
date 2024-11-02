import { ChatMessage } from "./immemory-chat-history";
import { PlaceholderParser, VariableDictionary } from "./types";
import { parseArgumentsWithoutLimits } from "./parse-arguments";

/**
 * Find all variables {{var_name}} and replace them with the actual value
 */
export const replaceVariables = (
  messages: ChatMessage[],
  variables: VariableDictionary
) => {
  const replacedMessages: ChatMessage[] = [];
  for (const message of messages) {
    const replacedMessage = JSON.parse(JSON.stringify(message));
    replacedMessage.content = replacedMessage.content.replace(
      /{{\s*(\w+)\s*}}/g,
      (match: string, p1: string) => variables[p1] || match
    );
    replacedMessages.push(replacedMessage);
  }
  return replacedMessages;
};

/**
 * Find all custom placeholders like {{#custom ...}} and replace them
 */
export const replaceCustomPlaceholders = async (
  messages: ChatMessage[],
  parsers: PlaceholderParser[]
) => {
  const replacedMessages: ChatMessage[] = [];
  for (const message of messages) {
    let replacedMessage = JSON.parse(JSON.stringify(message));
    for (const parser of parsers) {
      const matches = replacedMessage.content.match(parser.expression);
      if (matches) {
        // Process all matches sequentially
        for (const match of matches) {
          const args = parseArgumentsWithoutLimits(match, parser.name);
          const replacement = await parser.replacerFunction(match, args);
          replacedMessage.content = replacedMessage.content.replace(
            match,
            replacement
          );
        }
      }
    }
    replacedMessages.push(replacedMessage);
  }
  return replacedMessages;
};
