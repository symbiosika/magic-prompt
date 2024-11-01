import { nanoid } from "nanoid";
import {
  MemoryDictionary,
  ParsedTemplateBlocks,
  VariableDictionary,
  VariableType,
} from "./types";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content?: string | any;
};

export interface BaseChatSession {
  id: string;
  fullHistory: ChatMessage[];
  actualChat: ChatMessage[];
  createdAt: Date;
  lastUsedAt: Date;
}

export interface ChatSessionWithTemplate extends BaseChatSession {
  state: {
    useTemplate: {
      def: ParsedTemplateBlocks;
      blockIndex: number;
    };
    variables: VariableDictionary;
    memories: MemoryDictionary;
  };
}

export interface ChatSessionWithoutTemplate extends BaseChatSession {
  state: {
    useTemplate: undefined;
    variables: VariableDictionary;
    memories: MemoryDictionary;
  };
}

export type ChatSession = ChatSessionWithTemplate | ChatSessionWithoutTemplate;

class ChatHistoryStore {
  private sessions: Map<string, ChatSession> = new Map();

  constructor(private maxAgeHours: number = 48) {
    // Start cleanup job every hour
    setInterval(() => this.cleanup(), 1000 * 60 * 60);
  }

  create(useTemplate?: ParsedTemplateBlocks): ChatSession {
    const chatId = nanoid(16);
    const session = {
      id: chatId,
      actualChat: [],
      fullHistory: [],
      state: {
        variables: {},
        memories: {},
        useTemplate: useTemplate
          ? { def: useTemplate, blockIndex: 0 }
          : undefined,
      },
      createdAt: new Date(),
      lastUsedAt: new Date(),
    } as ChatSession;
    this.sessions.set(chatId, session);
    return session;
  }

  get(chatId: string): ChatSession | null {
    const session = this.sessions.get(chatId);
    if (session) {
      session.lastUsedAt = new Date();
      return session;
    } else {
      return null;
    }
  }

  set(
    chatId: string,
    set: {
      actualChat?: ChatMessage[];
      appendToHistory?: ChatMessage[];
      template?: ParsedTemplateBlocks;
      blockIndex?: number;
    }
  ): void {
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
    session.lastUsedAt = new Date();
  }

  setVariable(chatId: string, key: string, value: VariableType): void {
    const session = this.sessions.get(chatId);
    if (!session) throw new Error("Session not found");
    session.state.variables[key] = value;
  }

  getVariable(chatId: string, key: string): VariableType {
    const session = this.sessions.get(chatId);
    if (!session) throw new Error("Session not found");
    return session.state.variables[key];
  }

  appendToMemory(chatId: string, memoryKey: string, value: VariableType): void {
    const session = this.sessions.get(chatId);
    if (!session) throw new Error("Session not found");
    if (!session.state.memories[memoryKey])
      session.state.memories[memoryKey] = [];
    session.state.memories[memoryKey].push(value);
  }

  cleanup(): void {
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
