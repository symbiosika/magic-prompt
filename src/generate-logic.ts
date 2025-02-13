import { nanoid } from "nanoid";
import {
  ParsedTemplate,
  ParsedBlock,
  ParsedFunction,
  BlockWithMessages,
  ParsedTemplateBlocks,
  PlaceholderParser,
  BlockParser,
  ParsedMessage,
} from "./types";
import { parseTemplateRaw } from "./generate-raw-blocks";
import { parseArgumentsWithoutLimits } from "./parse-arguments";

// Helper function to check if a value is effectively undefined
const isEffectivelyUndefined = (value: any): boolean => {
  return value === undefined || value === "none";
};

// Helper function to parse boolean values
const parseBoolean = (value: any): boolean | undefined => {
  if (isEffectivelyUndefined(value)) return undefined;
  return value === true || value === "true";
};

// Helper function to parse number values
const parseNumber = (value: any): number | undefined => {
  if (isEffectivelyUndefined(value)) return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
};

// Helper function to parse condition next values
const parseConditionNext = (
  value: any,
  checker: any
): ParsedBlock["conditionNext"] => {
  if (isEffectivelyUndefined(value)) {
    return undefined;
  }
  return {
    value: String(value),
    checker: isEffectivelyUndefined(checker) ? undefined : String(checker),
  };
};

// Helper function to parse executeOnStart and executeOnEnd function arrays
const parseExecuteFunctions = (value: any): string[] | undefined => {
  if (isEffectivelyUndefined(value)) return undefined;
  return String(value)
    .split(",")
    .map((f) => f.trim())
    .filter((f) => f.length > 0);
};

// Helper to parse callback blocks
const parseCallback = (block: BlockWithMessages): ParsedBlock["callback"] => {
  const args = block.arguments || {};

  return {
    role: args.role ? String(args.role) : "assistant",
    contentVariable: args.content ? String(args.content) : undefined,
    returnVariables: args.answer_variables
      ? String(args.answer_variables)
          .split(",")
          .map((v) => v.trim())
      : [],
    possibleTriggers: args.possible_triggers
      ? String(args.possible_triggers)
          .split(",")
          .map((v) => v.trim())
      : [],
    transmitVariables: args.variables
      ? String(args.variables)
          .split(",")
          .map((v) => v.trim())
      : [],
  };
};

// Helper to parse setter blocks
const parseSetter = (block: BlockWithMessages): ParsedBlock["setter"] => {
  return {
    variables: block.arguments || {},
  };
};

// Helper to parse LLM return type
const parseOutputType = (value: any): "text" | "json" => {
  if (isEffectivelyUndefined(value)) return "text";
  if (value === "json") return "json";
  return "text";
};

/**
 * Parse a block and parse all its arguments
 * {{#block
 *  name=question_loop
 *  next=next_question
 *  condition_next_value=none
 *  condition_next_checker=none
 *  execute_on_start=func1,func2
 *  execute_on_end=func3,func4
 *  clear_on_start=true
 *  clear_on_end=false
 *  max_tokens=1
 *  output=llm_check
 *  memory=llm_checks
 *  allow_open_chat=false
 *  allow_user_skip=true
 *  allow_user_next=false
 * }}
 */
const parseBlock = (block: BlockWithMessages): ParsedBlock => {
  const args = block.arguments || {};

  const parsedBlock: ParsedBlock = {
    name: args.name ? String(args.name) : nanoid(),
    executeOnStart: parseExecuteFunctions(args.execute_on_start),
    executeOnEnd: parseExecuteFunctions(args.execute_on_end),
    next: isEffectivelyUndefined(args.next) ? undefined : String(args.next),
    conditionNext: parseConditionNext(
      args.condition_next_value,
      args.condition_next_checker
    ),
    allowOpenChat: parseBoolean(args.allow_open_chat),
    allowManualSkip: parseBoolean(args.allow_user_skip),
    allowManualNext: parseBoolean(args.allow_user_next),
    clearOnStart: parseBoolean(args.clear_on_start),
    clearOnEnd: parseBoolean(args.clear_on_end),
    maxTokens: parseNumber(args.max_tokens),
    outputType: parseOutputType(args.output_type),
    model: args.model ? String(args.model) : undefined,
    temperature: parseNumber(args.temperature),
    outputVariable: isEffectivelyUndefined(args.output)
      ? undefined
      : String(args.output),
    memoryVariable: isEffectivelyUndefined(args.memory)
      ? undefined
      : String(args.memory),
    messages: block.messages,
  };

  return parsedBlock;
};

/**
 * Helper to parse a function
 * {{#function
 *  name=generate_question
 *  output=actual_question
 *  memory=asked_questions
 * }}
 */
const parseFunction = (func: BlockWithMessages): ParsedFunction => {
  const args = func.arguments || {};

  if (!args.output) {
    throw new Error(
      `Function ${args.name || "unnamed"} must have an output variable`
    );
  }

  const parsedFunction: ParsedFunction = {
    name: args.name ? String(args.name) : nanoid(),
    outputVariable: String(args.output),
    memoryVariable: isEffectivelyUndefined(args.memory)
      ? undefined
      : String(args.memory),
    messages: func.messages,
  };

  return parsedFunction;
};

// Function to extract placeholders from messages
const extractPlaceholders = (
  messages: ParsedMessage[],
  parsers: PlaceholderParser[]
): void => {
  for (const message of messages) {
    for (const parser of parsers) {
      if (!parser.expression) {
        parser.expression = new RegExp(`{{#${parser.name}([^}]*?)}}`, "g");
      }

      const matches = message.content?.match(parser.expression);
      if (matches) {
        for (const match of matches) {
          const args = parseArgumentsWithoutLimits(match, parser.name);
          message.placeholders.push({
            type: parser.name,
            fullMatch: match,
            arguments: Object.entries(args).map(([name, value]) => ({
              name,
              value,
              required: parser.requiredArguments?.includes(name) || false,
              type: typeof value as "string" | "number" | "boolean",
            })),
          });
        }
      }
    }
  }
};

/**
 * Main function to parse the JSON template
 */
export const parseTemplateToBlocks = (
  template: ParsedTemplate,
  parsers?: PlaceholderParser[]
): ParsedTemplateBlocks => {
  const errors: string[] = [...template.errors];
  const blocks: ParsedBlock[] = [];
  const functions: Record<string, ParsedFunction> = {};

  // Parse blocks and callbacks
  if (template.blocks) {
    for (const block of template.blocks) {
      try {
        if (parsers) {
          extractPlaceholders(block.messages, parsers);
        }
        if (block.type === "callback") {
          // Create a minimal block for callbacks
          blocks.push({
            name: nanoid(),
            messages: [],
            callback: parseCallback(block),
          });
        } else if (block.type === "set") {
          blocks.push({
            name: nanoid(),
            messages: [],
            setter: parseSetter(block),
          });
        } else {
          blocks.push(parseBlock(block));
        }
      } catch (error) {
        errors.push(
          `Error parsing block: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }

  // Parse functions
  if (template.functions) {
    for (const func of template.functions) {
      try {
        if (parsers) {
          extractPlaceholders(func.messages, parsers);
        }
        const parsedFunction = parseFunction(func);
        functions[parsedFunction.name] = parsedFunction;
      } catch (error) {
        errors.push(
          `Error parsing function: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }

  // Validate block references
  for (const block of blocks) {
    if (
      block.next &&
      !isEffectivelyUndefined(block.next) &&
      !blocks.find((b) => b.name === block.next)
    ) {
      errors.push(
        `Block "${block.name}" references non-existent next block "${block.next}"`
      );
    }
    if (
      block.conditionNext?.checker &&
      !functions[block.conditionNext.checker]
    ) {
      errors.push(
        `Block "${block.name}" references non-existent checker function "${block.conditionNext.checker}"`
      );
    }

    // Validate executeOnStart functions
    block.executeOnStart?.forEach((funcName) => {
      if (!functions[funcName]) {
        errors.push(
          `Block "${block.name}" references non-existent executeOnStart function "${funcName}"`
        );
      }
    });

    // Validate executeOnEnd functions
    block.executeOnEnd?.forEach((funcName) => {
      if (!functions[funcName]) {
        errors.push(
          `Block "${block.name}" references non-existent executeOnEnd function "${funcName}"`
        );
      }
    });
  }

  return {
    blocks,
    functions,
    errors,
  };
};

/**
 * Function to parse a template to blocks
 */
export const parseTemplate = async (
  template: string,
  options?: {
    blockParsers?: BlockParser[];
    additionalBlockParsers?: BlockParser[];
    placeholderParsers?: PlaceholderParser[];
    additionalPlaceholderParsers?: PlaceholderParser[];
  }
): Promise<ParsedTemplateBlocks> => {
  const rawTemplate = await parseTemplateRaw(template, options);
  const parsedTemplate = parseTemplateToBlocks(
    rawTemplate,
    options?.placeholderParsers || []
  );

  return parsedTemplate;
};
