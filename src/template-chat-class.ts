import { parseTemplateRaw } from "./generate-raw-blocks";
import { parseTemplateToBlocks } from "./generate-logic";
import { initChatFromUi } from "./iterator";
import {
  BlockParser,
  PlaceholderParser,
  ParsedTemplate,
  ParsedTemplateBlocks,
  UserChatQuery,
  UserChatResponse,
  TemplateChatLogger,
  LlmWrapper,
} from "./types";
import { standardBlockParsers } from "./standard-parsers";

export class TemplateChat {
  private blockParsers: BlockParser[];
  private placeholderParsers: PlaceholderParser[];
  private singleLineParsers: BlockParser[];
  private logger?: TemplateChatLogger;
  private llmWrapper: LlmWrapper;

  constructor(options: {
    placeholderParsers?: PlaceholderParser[];
    singleLineParsers: BlockParser[];
    llmWrapper: LlmWrapper;
    logger?: TemplateChatLogger;
  }) {
    this.blockParsers = [...standardBlockParsers];
    this.placeholderParsers = options?.placeholderParsers ?? [];
    this.singleLineParsers = options?.singleLineParsers ?? [];
    this.logger = options?.logger;
    this.llmWrapper = options.llmWrapper;
  }

  /**
   * Parse a template string to JSON format
   */
  async getJsonTemplate(templateString: string): Promise<ParsedTemplate> {
    return parseTemplateRaw(templateString, {
      blockParsers: this.blockParsers,
      placeholderParsers: this.placeholderParsers,
      singleLineParsers: this.singleLineParsers,
    });
  }

  /**
   * Parse a template string to blocks format
   */
  async getParsedTemplateFromString(
    templateString: string
  ): Promise<ParsedTemplateBlocks> {
    const jsonTemplate = await this.getJsonTemplate(templateString);
    return this.getParsedTemplateFromJson(jsonTemplate);
  }

  /**
   * Convert JSON template to blocks format
   */
  getParsedTemplateFromJson(template: ParsedTemplate): ParsedTemplateBlocks {
    return parseTemplateToBlocks(template);
  }

  /**
   * Initialize or continue a chat session
   */
  async chat(data: UserChatQuery): Promise<{
    chatId: string;
    result: UserChatResponse;
  }> {
    return initChatFromUi(
      data,
      this.llmWrapper,
      this.logger,
      this.placeholderParsers
    );
  }
}
