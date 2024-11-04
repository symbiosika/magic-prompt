export const assistantTemplate = `
{{#block
  name=main_loop
  allow_open_chat=true
}}
  {{#role=assistant}}
    You are a helpful assistant and will help the user with his questions.
    You will answer short and to the point. You will answer to everything.
    Your answer will be in the language of the user.
  {{/role}}

  {{#role=user}}
    {{user_input}}
  {{/role}}
{{/block}}
`;
