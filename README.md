# 🪄 Magic Prompt

The world's first text-based scripting library for creating complex LLM chat flows in your TypeScript App - no coding for the end-user is required!

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> ⚠️ **Experimental Status**: This project is currently a proof of concept and in experimental stage. Use with caution in production environments.

## 🤝 Contributing

We welcome contributions and ideas to improve this library!

## 🌟 Overview

Magic Prompt is a library that lets you create AI chat flows using simple text-based scripting. No Python, no complex programming - just intuitive text commands to build powerful conversational experiences.

You can use Magic Prompt to build simple templates with Variales or to build complex chain of thoughts prompting.

## ✨ Key Features

- **Text-Based Scripting**: Create complex chat flows using simple, intuitive syntax
- **No Programming Required**: Design advanced chat patterns without coding knowledge for the end-user
- **Powerful Control Flow**: Use blocks, variables, functions, and jump markers
- **Memory Management**: Optional you can use the Built-in variable and state management (in-memory)
- **Flexible Integration**: Works with various LLM providers. Depends on your implementation
- **Loop & Condition Support**: Create interactive, dynamic conversations

## 🚀 Quick Start

1. Install Magic Prompt:

```bash
npm install magic-prompt
```

2. Create your first chat flow:

```
{{#function name=generate_question output=actual_question}}
    {{#role=system}}
        You will create random questions.
    {{/role}}

    {{#role=user}}
        Create a question.
    {{/role}}
{{/function}}

{{#block name=ask_question execute_on_start=generate_question}}
    {{#role=assistant}}
        {{actual_question}}
    {{/role}}

    {{#role=user}}
        {{user_input}}
    {{/role}}
{{/block}}
```

## 🔧 Core Concepts

### Chat Blocks

Define conversation segments with specific roles and purposes:

```
{{#block}}
    {{#role=system}}
        Greet the user professionally.
    {{/role}}
{{/block}}
```

### Variables

Store and manage state throughout your conversation:

```
{{#set user_name=response}}
{{#role=assistant}}Hello {{user_name}}!{{/role}}
```

Variables can also be set by the user from the Chat or programmatically.
They are handled in the Chat-Session-Store in a key-value store.

### Functions

Create reusable conversation patterns:

```
{{#function name=validate_answer output=is_correct max_tokens=1}}
    {{#role=system}}
        Check if the answer is correct.
        You will respond only with "yes" or "no".
    {{/role}}
    {{#role=user}}
        {{users_answer}}
    {{/role}}
{{/function}}
```

### Jump Markers

Control conversation flow:

```
{{#block condition_next_checker=validate_answer condition_next_value="yes" next=my_next_block}}
```

## 📚 Documentation

...more documentation will follow soon...

### Block Arguments

Blocks can be configured with the following arguments:

```
{{#block
  name="my_block"              # Optional: Unique identifier (auto-generated if not provided)
  next="next_block"            # Optional: Name of the next block to execute
  condition_next_value="yes"   # Optional: Value to check for conditional next block
  condition_next_checker="fn"  # Optional: Function name to check condition
  execute_on_start="fn1,fn2"   # Optional: Comma-separated functions to run before block
  execute_on_end="fn3,fn4"     # Optional: Comma-separated functions to run after block
  clear_on_start=true          # Optional: Clear chat history before block (default: false)
  clear_on_end=false           # Optional: Clear chat history after block (default: false)
  max_tokens=1000              # Optional: Maximum tokens for LLM response
  output="variable_name"       # Optional: Variable to store LLM response
  memory="memory_name"         # Optional: Array variable to accumulate responses
  allow_open_chat=false        # Optional: Allow free-form chat (default: false)
  allow_user_skip=true         # Optional: Allow user to skip block (default: false)
  allow_user_next=false        # Optional: Allow user to jump to next block (default: false)
}}
```

### Function Arguments

Functions can be configured with the following arguments:

```
{{#function
  name="my_function"         # Optional: Unique identifier (auto-generated if not provided)
  output="variable_name"     # Required: Variable to store function output
  memory="memory_name"       # Optional: Array variable to accumulate outputs
}}
```

### Callback Block Arguments

Callback blocks are special blocks for handling user input:

```
{{#callback
  role="assistant"              # Required: Role for the callback (usually "assistant")
  content=var_name              # Optional: Variable that will be the message content
  variables=var1,var2           # Optional: Variables that will be given back to the user from the store
  answer_variables=var1,var2    # Optional: Comma-separated variables that the user can return to his next prompt
  possible_triggers=next,skip   # Optional: Comma-separated list of possible triggers that the user can use
}}
```

## 🌟 Why Magic Prompt?

- **Simplicity**: Write complex chat flows in plain text
- **Flexibility**: Adapt to any conversational use case
- **Power**: Create sophisticated flows without programming
- **Maintainability**: Easy to read, modify, and share
- **Integration**: Works with popular all\* providers
