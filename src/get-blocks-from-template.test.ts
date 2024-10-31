// @ts-ignore
import { describe, it, expect } from "bun:test";
import { getBlocksFromTemplate } from "./get-blocks-from-template";
import { standardBlockParsers } from "./standard-parsers";

describe("getBlocksFromTemplate", () => {
  describe("Basic Block Parsing", () => {
    it("should handle empty template", () => {
      const result = getBlocksFromTemplate("", standardBlockParsers);

      for (const parser of standardBlockParsers) {
        expect(
          result.filter((block) => block.type === parser.name)
        ).toHaveLength(0);
      }
    });

    it("should handle whitespace and newlines", () => {
      const template = `
        {{#block}}
          content with    spaces   
        {{/block}}
      `;

      const result = getBlocksFromTemplate(template, standardBlockParsers);
      expect(result.filter((block) => block.type === "block")[0].content).toBe(
        "content with    spaces"
      );
    });
  });

  describe("Block Types", () => {
    it("should parse simple blocks without arguments", () => {
      const template = `
        {{#block}}content{{/block}}
        {{#init}}init content{{/init}}
      `;

      const result = getBlocksFromTemplate(template, standardBlockParsers);

      expect(
        result.filter((block) => block.type === "block")[0].arguments
      ).toEqual({});
      expect(
        result.filter((block) => block.type === "init")[0].arguments
      ).toEqual({});
    });

    it("should parse function blocks with required arguments", () => {
      const template = `
        {{#function name="test1" output="string"}}content 1{{/function}}
        {{#function name="test2" output="number"}}content 2{{/function}}
      `;

      const result = getBlocksFromTemplate(template, standardBlockParsers);

      expect(result.filter((block) => block.type === "function").length).toBe(
        2
      );
      expect(
        result.filter((block) => block.type === "function")[0].arguments
      ).toEqual({
        name: "test1",
        output: "string",
      });
      expect(
        result.filter((block) => block.type === "function")[1].arguments
      ).toEqual({
        name: "test2",
        output: "number",
      });
    });

    it("should throw error for missing required arguments", () => {
      const template = `{{#function name="test"}}content{{/function}}`;

      expect(() =>
        getBlocksFromTemplate(template, standardBlockParsers)
      ).toThrow(/Missing required arguments.*output/);
    });
  });

  describe("Nested Content", () => {
    it("should parse nested role definitions", () => {
      const template = `
        {{#block}}
          {{#role=system}}system message{{/role}}
          {{#role=user}}user message{{/role}}
        {{/block}}
      `;

      const result = getBlocksFromTemplate(template, standardBlockParsers);
      expect(result.filter((block) => block.type === "block")[0].content).toBe(
        "{{#role=system}}system message{{/role}}\n          {{#role=user}}user message{{/role}}"
      );
    });

    it("should handle deeply nested content", () => {
      const template = `
        {{#block}}
          {{#role=system}}
            outer
            {{#role=user}}inner{{/role}}
          {{/role}}
        {{/block}}
      `;

      const result = getBlocksFromTemplate(template, standardBlockParsers);
      expect(
        result.filter((block) => block.type === "block")[0].content
      ).toContain("outer");
      expect(
        result.filter((block) => block.type === "block")[0].content
      ).toContain("{{#role=user}}inner{{/role}}");
    });
  });
});
