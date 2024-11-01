// @ts-ignore
import { describe, it, expect } from "bun:test";
import { parseTemplateToBlocks } from "./generate-logic";
import { ParsedTemplate } from "./types";

describe("parseTemplateToBlocks", () => {
  it("should correctly parse a json template", () => {
    const template: ParsedTemplate = {
      errors: [],
      blocks: [
        {
          type: "block",
          arguments: {
            name: "next_question",
            clear_on_start: true,
            clear_on_end: false,
            output: "none",
          },
          messages: [
            {
              role: "assistant",
              content: "The actual question is: {{actual_question}}",
              variables: { actual_question: true },
              placeholders: [],
              setters: [],
            },
            {
              role: "user",
              content:
                "What is the actual question? Reply with the question only.",
              variables: {},
              placeholders: [],
              setters: [],
            },
          ],
          order: 0,
        },
        {
          type: "block",
          arguments: {
            name: "question_loop",
            next: "next_question",
            condition_next_value: "none",
            condition_next_checker: "none",
            clear_on_start: true,
            clear_on_end: false,
            max_tokens: 1,
            output: "llm_check",
            memory: "llm_checks",
            allow_user_skip: true,
            allow_user_next: false,
          },
          messages: [
            /* messages omitted for brevity */
          ],
          order: 1,
        },
        {
          type: "block",
          arguments: {
            clear_on_start: true,
          },
          messages: [
            /* messages omitted for brevity */
          ],
          order: 2,
        },
      ],
      functions: [
        {
          type: "function",
          arguments: {
            name: "generate_question",
            memory: "asked_questions",
            output: "actual_question",
          },
          messages: [
            /* messages omitted for brevity */
          ],
          order: 3,
        },
      ],
      init: [],
    };

    const result = parseTemplateToBlocks(template);

    // Test that there are no errors
    expect(result.errors).toEqual([]);

    // Test blocks parsing
    expect(result.blocks).toHaveLength(3);

    // Test first block
    expect(result.blocks[0]).toMatchObject({
      name: "next_question",
      clearOnStart: true,
      clearOnEnd: false,
      outputVariable: undefined,
    });

    // Test second block (question_loop)
    expect(result.blocks[1]).toMatchObject({
      name: "question_loop",
      next: "next_question",
      conditionNext: undefined,
      clearOnStart: true,
      clearOnEnd: false,
      maxTokens: 1,
      outputVariable: "llm_check",
      memoryVariable: "llm_checks",
      allowManualSkip: true,
      allowManualNext: false,
    });

    // Test third block
    expect(result.blocks[2]).toMatchObject({
      clearOnStart: true,
    });

    // Test functions parsing
    expect(Object.keys(result.functions)).toHaveLength(1);
    expect(result.functions["generate_question"]).toMatchObject({
      name: "generate_question",
      outputVariable: "actual_question",
      memoryVariable: "asked_questions",
    });
  });

  it("should handle missing required fields", () => {
    const template: ParsedTemplate = {
      errors: [],
      blocks: [],
      functions: [
        {
          type: "function",
          arguments: {
            name: "test_function",
            // missing required output
          },
          messages: [],
          order: 0,
        },
      ],
      init: [],
    };

    const result = parseTemplateToBlocks(template);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("must have an output variable");
  });

  it("should validate block references", () => {
    const template: ParsedTemplate = {
      errors: [],
      blocks: [
        {
          type: "block",
          arguments: {
            name: "test_block",
            next: "non_existent_block",
          },
          messages: [],
          order: 0,
        },
      ],
      functions: [],
      init: [],
    };

    const result = parseTemplateToBlocks(template);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("references non-existent next block");
  });

  it('should handle "none" values as undefined', () => {
    const template: ParsedTemplate = {
      errors: [],
      blocks: [
        {
          type: "block",
          arguments: {
            name: "test_block",
            output: "none",
            memory: "none",
          },
          messages: [],
          order: 0,
        },
      ],
      functions: [],
      init: [],
    };

    const result = parseTemplateToBlocks(template);
    expect(result.blocks[0].outputVariable).toBeUndefined();
    expect(result.blocks[0].memoryVariable).toBeUndefined();
  });
});
