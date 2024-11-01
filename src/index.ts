/*
 */

import { getBlocksFromTemplate } from "./get-blocks-from-template";
import {
  findVariablePlaceholders,
  parseSpecialPlaceholders,
} from "./get-placeholders";
import { parseDialogFromBlock } from "./parse-dialog-from-block";
import {
  standardBlockParsers,
  standardPlaceholderParsers,
} from "./standard-parsers";
import {
  BlockParser,
  BlockWithMessages,
  PlaceholderParser,
  ParsedMessage,
  ParsedTemplate,
  Message,
  Placeholder,
  Setter,
} from "./types";

export * from "./standard-parsers";

/**
 * Removes comments from template string
 */
const stripComments = (template: string): string => {
  return template.replace(/{{!--[\s\S]*?--}}/g, "");
};

const mapStringsToBoolDict = (strings: string[]): Record<string, boolean> => {
  return strings.reduce((acc, string) => {
    acc[string] = true;
    return acc;
  }, {} as Record<string, boolean>);
};

const mapPlaceholderToSetter = (item: Placeholder): Setter => {
  if (item.arguments.length === 0) {
    throw new Error("Setter has no arguments");
  }

  return {
    fullMatch: item.fullMatch,
    name: item.arguments[0].name,
    value: item.arguments[0].value ?? "",
  };
};

export const extendChatMessages = (messages: Message[]): ParsedMessage[] => {
  const parsedMessages: ParsedMessage[] = [];

  for (const message of messages) {
    const variables = findVariablePlaceholders(message.content ?? "");
    const specialPlaceholders = parseSpecialPlaceholders(
      message.content ?? "",
      standardPlaceholderParsers
    );

    parsedMessages.push({
      ...message,
      variables: mapStringsToBoolDict(variables),
      placeholders: specialPlaceholders.filter((e) => e.type !== "set"),
      setters: specialPlaceholders
        .filter((e) => e.type === "set")
        .map(mapPlaceholderToSetter),
    });
  }

  return parsedMessages;
};

/**
 * Main function to parse a raw template
 */
export const parseTemplateRaw = async (
  template: string,
  options?: {
    blockParsers?: BlockParser[];
    additionalBlockParsers?: BlockParser[];
    placeholderParsers?: PlaceholderParser[];
    additionalPlaceholderParsers?: PlaceholderParser[];
  }
): Promise<ParsedTemplate> => {
  // Define the parsers. Add additional parsers if provided
  const blockParsers = options?.blockParsers ?? [...standardBlockParsers];
  if (options?.additionalBlockParsers) {
    blockParsers.push(...options.additionalBlockParsers);
  }

  const placeholderParsers = options?.placeholderParsers ?? [
    ...standardPlaceholderParsers,
  ];
  if (options?.additionalPlaceholderParsers) {
    placeholderParsers.push(...options.additionalPlaceholderParsers);
  }

  // Remove comments from template
  const templateWithoutComments = stripComments(template);

  // Get all blocks from template
  const rawBlocks = getBlocksFromTemplate(
    templateWithoutComments,
    blockParsers
  );

  const BlockWithMessagess: BlockWithMessages[] = [];

  // Iterate over all blocks
  for (const block of rawBlocks) {
    // Parse the Dialog
    const dialog = parseDialogFromBlock(block);

    // Create the parsed block
    const BlockWithMessages: BlockWithMessages = {
      type: block.type,
      arguments: block.arguments,
      messages: extendChatMessages(dialog),
      order: block.order,
    };

    BlockWithMessagess.push(BlockWithMessages);
  }

  const parsedTemplate: ParsedTemplate = {
    errors: [],
    blocks: BlockWithMessagess.filter(
      (block) => block.type === "block" || block.type === "loop"
    ).sort((a, b) => a.order - b.order),
    functions: BlockWithMessagess.filter(
      (block) => block.type === "function"
    ).sort((a, b) => a.order - b.order),
    init: BlockWithMessagess.filter((block) => block.type === "init").sort(
      (a, b) => a.order - b.order
    ),
  };

  return parsedTemplate;
};
