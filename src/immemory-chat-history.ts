import { nanoid } from "nanoid";
import {
  ChatMessage,
  ChatSession,
  ChatSessionWithTemplate,
  ParsedTemplateBlocks,
  VariableDictionary,
  VariableType,
  VariableTypeInMemory,
} from "./types";

export class ChatHistoryStore {
  private sessions: Map<string, ChatSession> = new Map();

  constructor(private maxAgeHours: number = 48) {
    // Start cleanup job every hour
    setInterval(() => this.cleanup(), 1000 * 60 * 60);
  }

  async create(options?: {
    chatId?: string;
    useTemplate?: ParsedTemplateBlocks;
  }): Promise<ChatSession> {
    const chatId = options?.chatId ?? nanoid(16);
    const session = {
      id: chatId,
      actualChat: [],
      fullHistory: [],
      state: {
        variables: {},
        useTemplate: options?.useTemplate
          ? { def: options.useTemplate, blockIndex: 0 }
          : undefined,
      },
      createdAt: new Date(),
      lastUsedAt: new Date(),
    } as ChatSession;
    this.sessions.set(chatId, session);
    return session;
  }

  async get(chatId: string): Promise<ChatSession | null> {
    const session = this.sessions.get(chatId);
    if (session) {
      session.lastUsedAt = new Date();
      return session;
    } else {
      return null;
    }
  }

  async set(
    chatId: string,
    set: {
      actualChat?: ChatMessage[];
      appendToHistory?: ChatMessage[];
      template?: ParsedTemplateBlocks;
      blockIndex?: number;
    }
  ): Promise<void> {
    const session = this.sessions.get(chatId);
    if (!session) throw new Error("Session not found");
    if (set.actualChat) session.actualChat = set.actualChat;
    if (set.appendToHistory) session.fullHistory.push(...set.appendToHistory);
    if (set.template)
      (session as ChatSessionWithTemplate).state.useTemplate = {
        def: set.template,
        blockIndex:
          set.blockIndex ??
          (session as ChatSessionWithTemplate).state.useTemplate?.blockIndex ??
          0,
      };
    if (set.blockIndex)
      (session as ChatSessionWithTemplate).state.useTemplate.blockIndex =
        set.blockIndex;
    session.lastUsedAt = new Date();
  }

  async setVariable(
    chatId: string,
    key: string,
    value: VariableType
  ): Promise<void> {
    const session = this.sessions.get(chatId);
    if (!session) throw new Error("Session not found");
    session.state.variables[key] = value;
  }

  async mergeVariables(
    chatId: string,
    variables: VariableDictionary
  ): Promise<void> {
    const session = this.sessions.get(chatId);
    if (!session) throw new Error("Session not found");
    session.state.variables = { ...session.state.variables, ...variables };
  }

  async getVariable(
    chatId: string,
    key: string
  ): Promise<VariableTypeInMemory> {
    const session = this.sessions.get(chatId);
    if (!session) throw new Error("Session not found");
    return session.state.variables[key];
  }

  async appendToMemory(
    chatId: string,
    memoryKey: string,
    value: VariableType
  ): Promise<void> {
    const session = this.sessions.get(chatId);
    if (!session) throw new Error("Session not found");
    if (
      !session.state.variables[memoryKey] ||
      !Array.isArray(session.state.variables[memoryKey])
    )
      session.state.variables[memoryKey] = [] as VariableTypeInMemory;
    (session.state.variables[memoryKey] as VariableType[]).push(value);
  }

  async cleanup(): Promise<void> {
    const now = new Date();
    for (const [chatId, session] of this.sessions.entries()) {
      const hoursSinceLastUse =
        (now.getTime() - session.lastUsedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastUse > this.maxAgeHours) {
        this.sessions.delete(chatId);
      }
    }
  }
}

export const chatStore = new ChatHistoryStore(48);
