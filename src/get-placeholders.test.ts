// @ts-ignore
import { describe, it, expect } from "bun:test";
import {
  findVariablePlaceholders,
  parseSpecialPlaceholders,
} from "./get-placeholders";
import {
  PlaceholderParser,
  PlaceholderArgumentDict,
  VariableDictionaryInMemory,
} from "./types";

export const standardPlaceholderParsers: PlaceholderParser[] = [
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
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: VariableDictionaryInMemory
    ) => {
      // to do
      return match;
    },
  },
];

describe("findVariablePlaceholders", () => {
  it("should find simple variable placeholders", () => {
    const content = "Hello {{name}}, welcome to {{place}}!";
    const result = findVariablePlaceholders(content);
    expect(result).toEqual(["name", "place"]);
  });

  it("should return empty array when no placeholders found", () => {
    const content = "Hello world!";
    const result = findVariablePlaceholders(content);
    expect(result).toEqual([]);
  });

  it("should ignore special placeholders", () => {
    const content = 'Hello {{name}}, check {{#url link="example.com"}}';
    const result = findVariablePlaceholders(content);
    expect(result).toEqual(["name"]);
  });
});

describe("parseSpecialPlaceholders", () => {
  it("should parse special placeholders with required arguments", () => {
    const content = '{{#url link="https://example.com"}}';
    const result = parseSpecialPlaceholders(
      content,
      standardPlaceholderParsers
    );

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("url");
    expect(result[0].fullMatch).toBe(content);
    expect(result[0].arguments).toContainEqual(
      expect.objectContaining({
        name: "link",
        value: "https://example.com",
        required: true,
      })
    );
  });

  it("should parse special placeholders with optional arguments", () => {
    const content = '{{#url link="https://example.com" comment="Test link"}}';
    const result = parseSpecialPlaceholders(
      content,
      standardPlaceholderParsers
    );

    expect(result).toHaveLength(1);
    expect(result[0].arguments).toHaveLength(2);
    expect(result[0].arguments).toContainEqual(
      expect.objectContaining({
        name: "comment",
        value: "Test link",
        required: false,
      })
    );
  });

  it("should return empty array when no special placeholders found", () => {
    const content = "Hello {{name}}!";
    const result = parseSpecialPlaceholders(
      content,
      standardPlaceholderParsers
    );
    console.log("result", result);
    expect(result).toEqual([]);
  });

  it("should handle multiple instances of the same placeholder", () => {
    const content = `
      {{#url link="https://example1.com"}}
      {{#url link="https://example2.com" comment="Second link"}}
    `;
    const result = parseSpecialPlaceholders(
      content,
      standardPlaceholderParsers
    );

    expect(result).toHaveLength(2);
    expect(result[0].arguments[0].value).toBe("https://example1.com");
    expect(result[1].arguments[0].value).toBe("https://example2.com");
  });
});
