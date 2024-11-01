// @ts-ignore
import { describe, it, expect } from "bun:test";
import { parseTemplateRaw } from "./index";

describe("parseTemplate", () => {
  it("should parse a text template correctly", async () => {
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

{{#call function=generate_question}}

{{#block
  name=next_question
  clear_on_start=true
  clear_on_end=false
  output=none
}}  
  {{#role=assistant}}
    The actual question is: {{actual_question}}
  {{/role}}
  {{#role=user}}
    What is the actual question? Reply with the question only.
  {{/role}}
{{/block}}

{{!-- #callback role=assistant content=actual_question return=users_input --}}

{{#call_function=generate_summary}}

{{#block
  name=question_loop
  next=next_question
  condition_next_value=none
  condition_next_checker=none

  clear_on_start=true
  clear_on_end=false
  max_tokens=1
  output=llm_check
  memory=llm_checks

  allow_user_skip=true
  allow_user_next=false
}}
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
{{/block}}

{{#block clear_on_start=true}}
    {{#role=assistant}}
        You will check give the user a count of valid answers ("Correct") and invalid answers ("Not correct").
    {{/role}}

    {{#role=user}}
        Please give me my result. I had these results:
        {{llm_checks}}
    {{/role}}
{{/block}}
`;

    const result = await parseTemplateRaw(template, {});

    expect(result).toEqual({
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
              variables: {
                actual_question: true,
              },
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
          order: 1,
        },
        {
          type: "block",
          arguments: {
            clear_on_start: true,
          },
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
      init: [],
    });
  });
});
