// @ts-ignore
import { describe, it, expect } from 'bun:test';
import { parseTemplate } from './index';

describe('parseTemplate', () => {
  it('should parse a complete template correctly', async () => {
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

    const result = await parseTemplate(template, {});

    expect(result).toEqual({
      function: [
        {
          type: 'function',
          arguments: {
            name: 'generate_question',
            memory: 'asked_questions',
            output: 'actual_question',
          },
          messages: [
            {
              role: 'system',
              content: 'You will create random questions.',
              variables: {},
              placeholders: [],
              setters: [],
            },
            {
              role: 'user',
              content:
                'Create a question.\nYou have already asked these questions:\n{{asked_questions}}\n\nDon´t repeat yourself.',
              variables: {
                asked_questions: true,
              },
              placeholders: [],
              setters: [],
            },
          ],
        },
      ],
      init: [
        {
          type: 'init',
          arguments: {},
          messages: [
            {
              role: 'user',
              content: '{{#set actual_position=0}}',
              variables: {},
              placeholders: [],
              setters: [
                {
                  fullMatch: '{{#set actual_position=0}}',
                  name: 'actual_position',
                  value: 0,
                },
              ],
            },
          ],
        },
      ],
      block: [
        {
          type: 'block',
          arguments: {},
          messages: [
            {
              role: 'user',
              content: '{{#call function=generate_summary}}',
              variables: {},
              placeholders: [],
              setters: [],
            },
          ],
        },
      ],
      loop: [
        {
          type: 'loop',
          arguments: {
            output: 'final',
          },
          messages: [
            {
              role: 'system',
              content: 'Some text',
              variables: {},
              placeholders: [],
              setters: [],
            },
            {
              role: 'assistant',
              content: 'Some more text\n{{some_variable}}',
              variables: {
                some_variable: true,
              },
              placeholders: [],
              setters: [],
            },
            {
              role: 'user',
              content: '{{user_input}}',
              variables: {
                user_input: true,
              },
              placeholders: [],
              setters: [],
            },
            {
              role: 'user',
              content:
                '{{#next condition_checker=check_if_user_finished condition=Ja}}',
              variables: {},
              placeholders: [],
              setters: [],
            },
          ],
        },
      ],
    });
  });
});
