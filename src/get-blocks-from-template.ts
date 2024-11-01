import { parseArgumentsWithoutLimits } from "./parse-arguments";
import { parseDialogFromBlock } from "./parse-dialog-from-block";
import { BlockParser, BlockWithMessages, RawBlock } from "./types";

/**
 * Extracts raw matches from template using combined parser expressions
 */
const extractRawMatches = (
  template: string,
  parsers: BlockParser[]
): RegExpMatchArray[] => {
  // Extract the actual content between opening and closing tags
  const matches: RegExpMatchArray[] = [];
  for (const parser of parsers) {
    const pattern = new RegExp(
      `{{#${parser.name}[^}]*}}([\\s\\S]*?){{/${parser.name}}}`,
      "g"
    );
    const parserMatches = [...template.matchAll(pattern)];
    matches.push(...parserMatches);
  }
  return matches;
};

/**
 * Converts a raw match to a typed RawBlock with parsed arguments
 */
const convertMatchToRawBlock = (
  match: RegExpMatchArray,
  parsers: BlockParser[]
): RawBlock => {
  // Extract the opening tag from the full match
  const openingTag = match[0].match(/{{#[^}]+}}/)?.[0] || "";

  const matchedParser = parsers.find((parser) =>
    new RegExp(`{{#${parser.name}[^}]*}}`).test(openingTag)
  );

  if (!matchedParser) {
    throw new Error(`No matching parser found for content: ${openingTag}`);
  }

  const parsedArgs = matchedParser.argumentParser
    ? matchedParser.argumentParser(openingTag)
    : parseArgumentsWithoutLimits(openingTag, matchedParser.name);

  if (matchedParser.requiredArguments) {
    validateRequiredArguments(matchedParser, parsedArgs);
  }

  return {
    type: matchedParser.name,
    content: match[1].trim(), // Use captured content group
    arguments: parsedArgs,
    order: -1, // will be set later
  };
};

/**
 * Validates that all required arguments are present
 */
const validateRequiredArguments = (
  parser: BlockParser,
  args: Record<string, unknown>
): void => {
  if (!parser.requiredArguments) return;

  const missingArgs = parser.requiredArguments.filter((arg) => !(arg in args));

  if (missingArgs.length > 0) {
    throw new Error(
      `Missing required arguments for ${parser.name}: ${missingArgs.join(", ")}`
    );
  }
};

/**
 * Get all blocks from the template
 * This will interpret all {{#<selector> ... }} sections from the template that match the given parsers.
 */
export const getBlocksFromTemplate = (
  template: string,
  parsers: BlockParser[]
): RawBlock[] => {
  try {
    const matches = extractRawMatches(template, parsers);
    const typedMatches = matches.map((match, index) => ({
      ...convertMatchToRawBlock(match, parsers),
      order: index,
    }));

    // Instead of creating an object, just return the typed matches
    return typedMatches;
  } catch (error) {
    throw new Error(`Failed to parse template: ${error + ""}`);
  }
};
