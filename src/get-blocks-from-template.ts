import { parseArgumentsWithoutLimits } from "./parse-arguments";
import { parseDialogFromBlock } from "./parse-dialog-from-block";
import { BlockParser, BlockWithMessages, RawBlock } from "./types";

/**
 * Extracts raw matches from template using combined parser expressions
 */
const extractRawMatches = (
  template: string,
  parsers: BlockParser[],
  singleLineParsers: BlockParser[]
): RegExpMatchArray[] => {
  const matches: RegExpMatchArray[] = [];

  // Handle multi-line blocks
  for (const parser of parsers) {
    const pattern = new RegExp(
      `{{#${parser.name}[^}]*}}([\\s\\S]*?){{/${parser.name}}}`,
      "g"
    );
    const parserMatches = [...template.matchAll(pattern)];
    matches.push(...parserMatches);
  }

  // Handle single-line parsers
  for (const parser of singleLineParsers) {
    const pattern = new RegExp(`{{#${parser.name}[^}]*}}`, "g");
    const parserMatches = [...template.matchAll(pattern)];
    // Add empty content for single-line matches
    parserMatches.forEach((match) => {
      match[1] = ""; // Add empty content group
    });
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
  parsers: BlockParser[],
  singleLineParsers: BlockParser[]
): RawBlock[] => {
  try {
    const matches = extractRawMatches(template, parsers, singleLineParsers);
    const typedMatches = matches.map((match, index) => ({
      ...convertMatchToRawBlock(match, [...parsers, ...singleLineParsers]),
      order: index,
    }));

    return typedMatches;
  } catch (error) {
    throw new Error(`Failed to parse template: ${error + ""}`);
  }
};
