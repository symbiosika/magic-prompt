// @ts-ignore
import { describe, it, expect } from "bun:test";
import { parseTemplateRaw } from "./index";

describe("parseTemplate", () => {
  it("should parse a complete template correctly", async () => {
    const template = `
{{!-- 
A Comment. This must be removed!
--}}

{{#function name=generate_question memory=asked_questions output=actual_question}}  
{{#role=system}}
You will create random questions.
{{/role}}

{{#role=user}}      
Create a question.
You have already asked these questions:
{{asked_questions}}

Don´t repeat yourself.
{{/role}}
{{/function}}

{{#init}}
  {{#set actual_position=0}}
{{/init}}

{{#block}}
{{!--
One more Comment
--}}
{{#call function=generate_summary}}
{{/block}}

{{#loop output=final}}  
{{#role=system}}
Some text
{{/role}}

{{#role=assistant}}
Some more text
{{some_variable}}
{{/role}}

{{#role=user}}
{{user_input}}
{{/role}}

{{#next condition_checker=check_if_user_finished condition=Ja}}
{{/loop}}
`;

    const result = await parseTemplateRaw(template, {});

    expect(result).toEqual({
      errors: [],
      blocks: [
        {
          type: "block",
          arguments: {},
          messages: [
            {
              role: "user",
              content: "{{#call function=generate_summary}}",
              variables: {},
              placeholders: [],
              setters: [],
            },
          ],
          order: 0,
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
            {
              role: "system",
              content: "You will create random questions.",
              variables: {},
              placeholders: [],
              setters: [],
            },
            {
              role: "user",
              content:
                "Create a question.\nYou have already asked these questions:\n{{asked_questions}}\n\nDon´t repeat yourself.",
              variables: {
                asked_questions: true,
              },
              placeholders: [],
              setters: [],
            },
          ],
          order: 3,
        },
      ],
      init: [
        {
          type: "init",
          arguments: {},
          messages: [
            {
              role: "user",
              content: "{{#set actual_position=0}}",
              variables: {},
              placeholders: [],
              setters: [
                {
                  fullMatch: "{{#set actual_position=0}}",
                  name: "actual_position",
                  value: 0,
                },
              ],
            },
          ],
          order: 1,
        },
      ],
    });
  });

  it("should parse a complete quiz template correctly", async () => {
    const template = `
{{#function name=generate_question memory=asked_questions output=actual_question}}
    {{#role=system}}
        You will create random questions.
    {{/role}}

    {{#role=user}}
        Create a question.
        You have already asked these questions:
        {{asked_questions}}
        Don´t repeat yourself.
    {{/role}}
{{/function}}

{{#init}}
  {{#set actual_position=0}}
  {{#call function=generate_question}}
{{/init}}

{{#loop max=100 max_tokens=1 forget=true output=llm_checks next=manual_trigger}}
    {{#clear_chat_history}}
    {{#call function=generate_question}}
    {{#callback role=assistant content=actual_question return=users_input}}

    {{#role=system}}
        You will check if the user can answer random questions.
        Your answer will be a check for the answer. You will answer with "Correct" or "Not correct" only.
    {{/role}}

    {{#role=assistant}}
        {{actual_question}}
    {{/role}}

    {{#role=user}}
        {{users_input}}
    {{/role}}
{{/loop}}

{{#block}}
    {{#role=assistant}}
        You will check give the user a count of valid answers ("Correct") and invalid answers ("Not correct").
    {{/role}}

    {{#role=user}}
        Please give me my result. I had these results:
        {{llm_checks}}
    {{/role}}
{{/block}}`;

    const result = await parseTemplateRaw(template, {});

    expect(result).toEqual({
      errors: [],
      blocks: [
        {
          type: "block",
          arguments: {},
          messages: [
            {
              role: "assistant",
              content:
                'You will check give the user a count of valid answers ("Correct") and invalid answers ("Not correct").',
              variables: {},
              placeholders: [],
              setters: [],
            },
            {
              role: "user",
              content:
                "Please give me my result. I had these results:\n        {{llm_checks}}",
              variables: {
                llm_checks: true,
              },
              placeholders: [],
              setters: [],
            },
          ],
          order: 0,
        },
        {
          type: "loop",
          arguments: {
            max: 100,
            max_tokens: 1,
            forget: true,
            output: "llm_checks",
            next: "manual_trigger",
          },
          messages: [
            {
              role: "user",
              content:
                "{{#clear_chat_history}}\n    {{#call function=generate_question}}\n    {{#callback role=assistant content=actual_question return=users_input}}",
              variables: {},
              placeholders: [],
              setters: [],
            },
            {
              role: "system",
              content:
                'You will check if the user can answer random questions.\n        Your answer will be a check for the answer. You will answer with "Correct" or "Not correct" only.',
              variables: {},
              placeholders: [],
              setters: [],
            },
            {
              role: "assistant",
              content: "{{actual_question}}",
              variables: {
                actual_question: true,
              },
              placeholders: [],
              setters: [],
            },
            {
              role: "user",
              content: "{{users_input}}",
              variables: {
                users_input: true,
              },
              placeholders: [],
              setters: [],
            },
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
            {
              role: "system",
              content: "You will create random questions.",
              variables: {},
              placeholders: [],
              setters: [],
            },
            {
              role: "user",
              content:
                "Create a question.\n        You have already asked these questions:\n        {{asked_questions}}\n        Don´t repeat yourself.",
              variables: {
                asked_questions: true,
              },
              placeholders: [],
              setters: [],
            },
          ],
          order: 3,
        },
      ],
      init: [
        {
          type: "init",
          arguments: {},
          messages: [
            {
              role: "user",
              content:
                "{{#set actual_position=0}}\n  {{#call function=generate_question}}",
              variables: {},
              placeholders: [],
              setters: [
                {
                  fullMatch: "{{#set actual_position=0}}",
                  name: "actual_position",
                  value: 0,
                },
              ],
            },
          ],
          order: 1,
        },
      ],
    });
  });
});
