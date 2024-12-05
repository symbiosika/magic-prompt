import { nanoid } from "nanoid";
import {
  ChatMessage,
  ChatSession,
  ChatSessionWithTemplate,
  ParsedTemplateBlocks,
  VariableDictionary,
  VariableType,
  VariableTypeInMemory,
  ChatHistoryStore,
  VariableDictionaryInMemory,
} from "./types";

export class ChatHistoryStoreInMemory implements ChatHistoryStore {
  private sessions: Map<string, ChatSession> = new Map();

  constructor(private maxAgeHours: number = 48) {
    // Start cleanup job every hour
    setInterval(() => this.cleanup(), 1000 * 60 * 60);
  }

  async create(options?: {
    chatId?: string;
    useTemplate?: ParsedTemplateBlocks;
    userId?: string;
  }): Promise<ChatSession> {
    const chatId = options?.chatId ?? nanoid(16);
    const session = {
      id: chatId,
      userId: options?.userId,
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
  ): Promise<VariableDictionaryInMemory> {
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

    return session.state.variables;
  }

  async setVariable(
    chatId: string,
    key: string,
    value: VariableType
  ): Promise<VariableDictionaryInMemory> {
    const session = this.sessions.get(chatId);
    if (!session) throw new Error("Session not found");
    session.state.variables[key] = value;

    return session.state.variables;
  }

  async mergeVariables(
    chatId: string,
    variables: VariableDictionary
  ): Promise<VariableDictionaryInMemory> {
    const session = this.sessions.get(chatId);
    if (!session) throw new Error("Session not found");
    session.state.variables = { ...session.state.variables, ...variables };

    return session.state.variables;
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
  ): Promise<VariableDictionaryInMemory> {
    const session = this.sessions.get(chatId);
    if (!session) throw new Error("Session not found");
    if (
      !session.state.variables[memoryKey] ||
      !Array.isArray(session.state.variables[memoryKey])
    )
      session.state.variables[memoryKey] = [] as VariableTypeInMemory;
    (session.state.variables[memoryKey] as VariableType[]).push(value);

    return session.state.variables;
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

  async getHistoryByUserId(
    userId: string,
    startFrom?: string
  ): Promise<
    {
      chatId: string;
      history: ChatMessage[];
    }[]
  > {
    const chats = Array.from(this.sessions.values()).filter(
      (session) =>
        session.id === userId &&
        (startFrom ? session.lastUsedAt > new Date(startFrom) : true)
    );
    return chats.map((chat) => ({
      chatId: chat.id,
      history: chat.fullHistory,
    }));
  }

  async getChatHistory(chatId: string): Promise<ChatMessage[]> {
    const session = this.sessions.get(chatId);
    if (!session) throw new Error("Session not found");
    return session.fullHistory;
  }
}

export const chatStore = new ChatHistoryStoreInMemory(48);
