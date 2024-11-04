import {
  BlockParser,
  PlaceholderArgumentDict,
  PlaceholderParser,
} from "./types";

export const standardBlockParsers: BlockParser[] = [
  {
    name: "block",
  },
  {
    name: "init",
    argumentParser: (_rawContent: string) => ({}),
  },
  {
    name: "function",
    requiredArguments: ["output", "name"],
  },
];

export const standardSingleLineParsers: BlockParser[] = [
  {
    name: "callback",
    requiredArguments: [],
  },
  {
    name: "set",
  },
];

export const standardPlaceholderParsers: PlaceholderParser[] = [];
