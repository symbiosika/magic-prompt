export type Message = {
  role: "user" | "assistant" | "system";
  content?: string;
};

export interface PlaceholderArgument {
  name: string;
  required: boolean;
  default?: string | number | boolean;
  type?: "string" | "number" | "boolean";
  multiple?: boolean;
  value?: string | number | boolean;
}

export interface Placeholder {
  type: string;
  fullMatch: string; // The original text that was matched
  arguments: PlaceholderArgument[];
}

export interface Setter {
  fullMatch: string; // The original text that was matched
  name: string;
  value: string | number | boolean;
}

export type ParsedMessage = Message & {
  placeholders: Placeholder[]; // like {{#url link="https://example.com"}}
  variables: Record<string, boolean>; // like {{actual_position}}
  setters: Setter[]; // like {{#set actual_position=0}}
};

export type VariableType = string | number | boolean | undefined;
export type VariableDictionary = Record<string, VariableType>;
export type MemoryDictionary = Record<string, VariableType[]>;

export type RawBlock = {
  type: string;
  content: string;
  arguments?: VariableDictionary;
  order: number;
};

export type BlockWithMessages = {
  type: string;
  arguments?: VariableDictionary;
  messages: ParsedMessage[];
  order: number;
};

export type BlockParser = {
  name: string;
  expression: RegExp;
  argumentParser?: (rawContent: string) => VariableDictionary; // a custom argument parser can be provided for each block type
  requiredArguments?: string[]; // a list of required arguments for the block type
};

export type PlaceholderParser = {
  name: string;
  expression: RegExp; // e.g. /{{#url="([^"]+)"(?:\s+(?:comment)=(?:"[^"]*"|[^}\s]+))*}}/
  requiredArguments?: string[]; // a simple list of required arguments for the placeholder
  arguments?: {
    // a complex list of arguments for the placeholder
    name: string;
    required?: boolean;
    type?: "string" | "number" | "boolean";
    multiple?: boolean;
    default?: string | number | boolean;
  }[];
};

export interface ParsedTemplate {
  errors: string[];
  functions?: BlockWithMessages[];
  blocks?: BlockWithMessages[];
  init?: BlockWithMessages[];
}

/**
 * Full parsed blocks in the script
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

  allow_open_chat=false
  allow_user_skip=true
  allow_user_next=false
}}
*/

export type ParsedBlock = {
  /**
   * The name can be defined by the user. otherwise a guid will be used
   */
  name: string;
  /**
   * Is executeFunction defined these functions will be called
   */
  executeOnStart?: string[];
  executeOnEnd?: string[];
  /**
   * The next block to call
   * The name needs will be checked if it exists when parsing the template
   */
  next?: string;
  /**
   * The next block to call if the condition is met
   * Both must be defined if one is defined
   */
  conditionNext?: {
    value: string; // a string value that will be checked to be equal to the output of the conditionCheck
    checker?: string; // the function-name to call to check if the condition is met
  };
  /**
   * User flow control
   */
  allowOpenChat?: boolean;
  allowManualSkip?: boolean; // a trigger will go to the next block independent of the "next" property
  allowManualNext?: boolean; // a trigger will go to the next block defined in the "next" property
  /**
   * Clear the chatHistory before or after the block is executed
   */
  clearOnStart?: boolean;
  clearOnEnd?: boolean;
  /**
   * The maximum number of tokens the LLM should use
   */
  maxTokens?: number;
  /**
   * A block can have ONE output variable and ONE memory variable
   * The output is always a string
   * The memory is always an array of strings
   */
  outputVariable?: string;
  memoryVariable?: string;
  /**
   * The LLM Dialog
   */
  messages: ParsedMessage[];
};

export type ParsedFunction = {
  /**
   * The name can be defined by the user. otherwise a guid will be used
   */
  name: string;
  /**
   * A funciton can have ONE output variable and ONE memory variable
   * The output is always a string
   * The memory is always an array of strings
   */
  outputVariable: string;
  memoryVariable?: string;
  messages: ParsedMessage[];
};

export type ParsedBlockReturnValue = {
  name: string;
  outputToVariable?: {
    variable: string;
    value: string;
  };
  outputToMemory?: {
    variable: string;
    value: string;
  };
};

export interface ParsedTemplateBlocks {
  blocks: ParsedBlock[];
  functions: Record<string, ParsedFunction>;
  errors: string[];
}

export type UserTrigger = {
  skip?: boolean;
  next?: boolean;
};
