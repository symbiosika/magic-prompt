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
  {
    name: "callback",
    requiredArguments: ["role", "return"],
  },
];

export const standardSingleLineParsers: BlockParser[] = [
  {
    name: "callback",
    requiredArguments: ["role", "return"],
  },
];

export const standardPlaceholderParsers: PlaceholderParser[] = [
  {
    name: "set",
    expression: /{{#set\s+([^=\s]+)=(.+?)}}/g,
    replacerFunction: async (match: string, args: PlaceholderArgumentDict) => {
      // to do
      return match;
    },
  },
  {
    name: "url",
    expression: /{{#url\s+link="[^"]*"(?:\s+comment="[^"]*")?}}/g,
    arguments: [
      {
        name: "link",
        required: true,
      },
      {
        name: "comment",
        required: false,
      },
    ],
    replacerFunction: async (match: string, args: PlaceholderArgumentDict) => {
      // to do
      return match;
    },
  },
  {
    name: "image",
    expression: /{{#image\s+link="[^"]*"(?:\s+comment="[^"]*")?}}/g,
    arguments: [
      {
        name: "link",
        required: true,
      },
    ],
    replacerFunction: async (match: string, args: PlaceholderArgumentDict) => {
      // to do
      return match;
    },
  },
  {
    name: "similar_to",
    expression:
      /{{#similar_to(?:\s+(?:search_for|id|category[1-3]|name|count|before|after|comment)=(?:"[^"]*"|[^}\s]+))+}}/g,
    arguments: [
      {
        name: "search_for",
        required: true,
      },
      {
        name: "id",
        type: "string",
        multiple: true,
      },
      {
        name: "category1",
        type: "string",
        multiple: true,
      },
      {
        name: "category2",
        type: "string",
        multiple: true,
      },
      {
        name: "category3",
        type: "string",
        multiple: true,
      },
      {
        name: "name",
        type: "string",
        multiple: true,
      },
      {
        name: "count",
        type: "number",
        default: 5,
      },
      {
        name: "before",
        type: "string",
        default: 0,
      },
      {
        name: "after",
        type: "string",
        default: 0,
      },
      {
        name: "comment",
        type: "string",
      },
    ],
    replacerFunction: async (match: string, args: PlaceholderArgumentDict) => {
      // to do
      return match;
    },
  },
  {
    name: "knowledgebase",
    expression:
      /{{#knowledgebase(?:\s+(?:id|category[1-3]|name|comment)=(?:"[^"]*"|[^}\s]+))*}}/g,
    arguments: [
      {
        name: "id",
        type: "string",
        multiple: true,
      },
      {
        name: "category1",
        type: "string",
        multiple: true,
      },
      {
        name: "category2",
        type: "string",
        multiple: true,
      },
      {
        name: "category3",
        type: "string",
        multiple: true,
      },
      {
        name: "name",
        type: "string",
        multiple: true,
      },
      {
        name: "comment",
        type: "string",
      },
    ],
    replacerFunction: async (match: string, args: PlaceholderArgumentDict) => {
      // to do
      return match;
    },
  },
  {
    name: "file",
    expression:
      /{{#file(?:\s+(?:id|source|bucket|comment)=(?:"[^"]*"|[^}\s]+))+}}/g,
    arguments: [
      {
        name: "source",
        type: "string",
        default: "db",
      },
      {
        name: "bucket",
        type: "string",
        default: "default",
      },
      {
        name: "comment",
        type: "string",
      },
      {
        name: "id",
        type: "string",
        multiple: true,
      },
    ],
    replacerFunction: async (match: string, args: PlaceholderArgumentDict) => {
      // to do
      return match;
    },
  },
];
