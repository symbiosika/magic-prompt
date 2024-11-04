import { describe, it, expect } from "bun:test";
import {
  replaceCustomPlaceholders,
  replaceVariables,
} from "./replace-variables";
import {
  ChatMessage,
  PlaceholderArgumentDict,
  PlaceholderParser,
  VariableDictionary,
} from "./types";

describe("replaceVariables", () => {
  it("should replace variables in message content", async () => {
    const messages: ChatMessage[] = [
      { role: "user", content: "Hello {{name}}, your age is {{age}}" },
      { role: "assistant", content: "No variables here" },
      { role: "user", content: "{{missing}} variable" },
    ];

    const variables: VariableDictionary = {
      name: "John",
      age: "25",
    };

    const result = await replaceVariables(messages, variables);

    expect(result).toEqual([
      { role: "user", content: "Hello John, your age is 25" },
      { role: "assistant", content: "No variables here" },
      { role: "user", content: "{{missing}} variable" },
    ]);
  });

  it("should handle whitespace in variable syntax", async () => {
    const messages: ChatMessage[] = [
      { role: "user", content: "Hello {{  name  }}" },
    ];

    const variables: VariableDictionary = {
      name: "John",
    };

    const result = await replaceVariables(messages, variables);

    expect(result).toEqual([{ role: "user", content: "Hello John" }]);
  });

  it("should not modify original messages", async () => {
    const messages: ChatMessage[] = [
      { role: "user", content: "Hello {{name}}" },
    ];

    const variables: VariableDictionary = {
      name: "John",
    };

    const result = await replaceVariables(messages, variables);

    expect(messages[0].content).toBe("Hello {{name}}");
    expect(result[0].content).toBe("Hello John");
  });
});

describe("replaceCustomPlaceholders", () => {
  it("should replace custom placeholders with parsed values", async () => {
    // Arrange
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: "Hello {{#custom1 test=val1 test2=val2}} world",
      },
    ];

    const parsers: PlaceholderParser[] = [
      {
        name: "custom1",
        expression: /{{\s*#custom1[^}]*}}/g,
        replacerFunction: async (
          match: string,
          args: PlaceholderArgumentDict
        ) => {
          return `${args.test}-${args.test2}`;
        },
      },
    ];

    // Act
    const result = await replaceCustomPlaceholders(messages, parsers, {});

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("Hello val1-val2 world");
  });

  it("should handle multiple custom placeholders in one message", async () => {
    // Arrange
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: "{{#custom1 test=val1}} and {{#custom1 test=val2}}",
      },
    ];

    const parsers: PlaceholderParser[] = [
      {
        name: "custom1",
        expression: /{{#custom1[^}]*}}/g,
        replacerFunction: async (
          match: string,
          args: PlaceholderArgumentDict
        ) => {
          return args.test + "";
        },
      },
    ];

    // Act
    const result = await replaceCustomPlaceholders(messages, parsers, {});

    // Assert
    expect(result[0].content).toBe("val1 and val2");
  });

  it("should not modify message when no matching parser is found", async () => {
    // Arrange
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: "Hello {{#unknown test=val1}} world",
      },
    ];

    const parsers: PlaceholderParser[] = [
      {
        name: "custom1",
        expression: /{{\s*#custom1[^}]*}}/g,
        replacerFunction: async (
          match: string,
          args: PlaceholderArgumentDict
        ) => {
          return args.test + "";
        },
      },
    ];

    // Act
    const result = await replaceCustomPlaceholders(messages, parsers, {});

    // Assert
    expect(result[0].content).toBe("Hello {{#unknown test=val1}} world");
  });

  it("should handle messages without placeholders", async () => {
    // Arrange
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: "Hello world",
      },
    ];

    const parsers: PlaceholderParser[] = [
      {
        name: "custom1",
        expression: /{{\s*#custom1[^}]*}}/g,
        replacerFunction: async (
          match: string,
          args: PlaceholderArgumentDict
        ) => {
          return args.test + "";
        },
      },
    ];

    // Act
    const result = await replaceCustomPlaceholders(messages, parsers, {});

    // Assert
    expect(result[0].content).toBe("Hello world");
  });
});
