# Magic Prompt

```
{{!--
A Comment. All comments will not be added to any chat
--}}

{{!--
Functions: You can define simple functions.
Each function has a output-variable and a name that has to be defined as minimum.
There is also an optional second variable "memory" which is always output as array with all generated answers.
Normally a function generates text since we are working with LLMs here!

Each function is a simple Dialog.
All happenings here will not be appended to the main chat.
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

{{!--
The init-Block is optional. This will be executed on start.
You can set variables here.
All happenings here will not be appended to the main chat.
--}}
{{#init}}
  {{#set actual_position=0}}
  {{#call function=generate_question}}
{{/init}}

{{!--
The main logic are blocks.
A "block" describes a Dialog which will be send to the LLM with one request!
Per default all blocks will be added to the main chat.
If you want to hide a block from the main chat you can add "forget=true".
If you execute complex Dialogs where some prompts have confidential information
you can hide that.
--}}

{{#loop
    max=100
    max_tokens=1
    forget=true
    output=llm_checks
    next=manual_trigger
    clear=true
    call=generate_question
    callback=true
    callback_role=assistant
    callback_return=users_input
    }}

     {{!--
     That will return the last message to the user. He must then active continue.
     content will push a list of values to the frontend in the given order.
     return is an array of requested values.
     --}}

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
{{/block}}
```

{{#chat_history}}

## Execute on file directly

ts-node .\src\cli.ts .\test\template.txt
