export const demoTemplate = `
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

{{#set demo=1}}

{{#block
  name=next_question
  clear_on_start=true
  clear_on_end=false
  output=none
  execute_on_start=generate_question
}}  
  {{#role=assistant}}
    The last question check was: {{llm_checks}}
    The actual question is: {{actual_question}}
  {{/role}}
  {{#role=user}}
    Give me a short answer if the last question check was not correct.
    And then give me the next question. In the following format:
    
    Your answer was <correct|incorrect>.
    The next question is: <question>
  {{/role}}
{{/block}}

{{#callback role=assistant content=actual_question answer_variables=user_input variables=llm_check possible_triggers=next,skip}}

{{#block
  name=question_loop
  next=next_question
  condition_next_value=none
  condition_next_checker=none
  clear_on_start=true
  clear_on_end=false
  max_tokens=50
  output=llm_check
  memory=llm_checks
  allow_user_skip=true
  allow_user_next=false
}}
    {{#role=system}}
        You will check if the user can answer random questions.
        Your answer will be a check for the answer.
        You will answer short with:
        "Correct" or
        "Not correct. The correct answer is: ..."
    {{/role}}

    {{#role=assistant}}
        {{actual_question}}
    {{/role}}

    {{#role=user}}
        {{user_input}}
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
