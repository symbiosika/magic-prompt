export type Message = {
  role: 'user' | 'assistant' | 'system';
  content?: string;
};

export interface PlaceholderArgument {
  name: string;
  required: boolean;
  default?: string | number | boolean;
  type?: 'string' | 'number' | 'boolean';
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

export type RawBlock = {
  type: string;
  content: string;
  arguments?: Record<string, string | number | boolean | undefined>;
};

export type ParsedBlock = {
  type: string;
  arguments?: Record<string, string | number | boolean | undefined>;
  messages: ParsedMessage[];
};

export type BlockParser = {
  name: string;
  expression: RegExp;
  argumentParser?: (
    rawContent: string
  ) => Record<string, string | number | boolean | undefined>; // a custom argument parser can be provided for each block type
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
    type?: 'string' | 'number' | 'boolean';
    multiple?: boolean;
    default?: string | number | boolean;
  }[];
};

export interface ParsedTemplate {
  [blockType: string]: ParsedBlock[];
}
