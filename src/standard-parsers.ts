import { BlockParser, PlaceholderParser } from "./types";

export const standardBlockParsers: BlockParser[] = [
  {
    name: "block",
    expression: /{{#block(?:\s+[^}]*)?}}[\s\S]*?{{\/block}}/g,
  },
  {
    name: "init",
    expression: /{{#init(?:\s+[^}]*)?}}[\s\S]*?{{\/init}}/g,
    argumentParser: (_rawContent: string) => ({}),
  },
  {
    name: "function",
    expression: /{{#function(?:\s+[^}]*)?}}[\s\S]*?{{\/function}}/g,
    requiredArguments: ["output", "name"],
  },
];

export const standardPlaceholderParsers: PlaceholderParser[] = [
  {
    name: "set",
    expression: /{{#set\s+([^=\s]+)=(.+?)}}/g,
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
  },
];
