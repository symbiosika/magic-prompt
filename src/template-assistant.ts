export const assistantTemplate = `
{{#block
  name=init
}}
  {{#role=assistant}}
    You are a helpful assistant and will help the user with his questions.
    You will answer short and to the point. You will answer to everything.
    Your answer will be in the language of the user.
  {{/role}}
{{/block}}

{{#set init_message="Hello. How can I help you today?"}}

{{#callback role=assistant content=init_message return=users_input}}

{{#block
  name=main_loop
  allow_open_chat=true
  allow_user_skip=true
  allow_user_next=true
}}
  {{#role=user}}
    {{users_input}}
  {{/role}}
{{/block}}
`;
