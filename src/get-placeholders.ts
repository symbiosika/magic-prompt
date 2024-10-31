import { parseArgumentsWithoutLimits } from "./parse-arguments";
import { PlaceholderParser, Placeholder, PlaceholderArgument } from "./types";

/**
 * Helper to find all variable placeholders in a string
 * Variable placeholders have the pattern {{varName}}
 */
export const findVariablePlaceholders = (content: string): string[] => {
  const regex = /{{([a-zA-Z0-9_]+)}}/g;
  const matches = content.match(regex);
  return matches?.map((match) => match.slice(2, -2)) ?? [];
};

/**
 * Parse all special placeholders and get their arguments using defined parsers
 */
export const parseSpecialPlaceholders = (
  content: string,
  placeholderParsers: PlaceholderParser[]
): Placeholder[] => {
  const results: Placeholder[] = [];

  placeholderParsers.forEach((parser) => {
    const matches = content.match(parser.expression);
    if (matches) {
      matches.forEach((match) => {
        const args = parseArgumentsWithoutLimits(match, parser.name);

        const argumentDetails: PlaceholderArgument[] = [];

        // Add all known arguments and fill default etc.
        parser.arguments?.forEach((argDef) => {
          argumentDetails.push({
            name: argDef.name,
            required: argDef.required ?? false,
            default: argDef.default,
            type: argDef.type ?? "string",
            multiple: argDef.multiple ?? false,
            value: args[argDef.name],
          });
        });

        // Add also all arguments that are not defined in the parser
        if (args) {
          const additionalArgs = Object.keys(args).filter(
            (key) => !argumentDetails.find((e) => e.name === key)
          );
          additionalArgs.forEach((arg) => {
            argumentDetails.push({
              name: arg,
              value: args[arg],
              required: false,
            });
          });
        }

        const Placeholder: Placeholder = {
          type: parser.name,
          fullMatch: match,
          arguments: argumentDetails,
        };
        results.push(Placeholder);
      });
    }
  });

  return results;
};
