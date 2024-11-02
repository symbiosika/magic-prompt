import { describe, it, expect, beforeEach } from "bun:test";
import { ChatHistoryStore } from "./immemory-chat-history";
import { ChatMessage, ParsedTemplateBlocks } from "./types";

describe("ChatHistoryStore", () => {
  let store: ChatHistoryStore;

  beforeEach(() => {
    // Create a new store before each test
    store = new ChatHistoryStore(48);
  });

  describe("create", () => {
    it("should create a new chat session without template", () => {
      const session = store.create();

      expect(session.id).toBeDefined();
      expect(session.id.length).toBe(16);
      expect(session.actualChat).toEqual([]);
      expect(session.fullHistory).toEqual([]);
      expect(session.state.useTemplate).toBeUndefined();
      expect(session.state.variables).toEqual({});
    });

    it("should create a new chat session with template", () => {
      const template: ParsedTemplateBlocks = {
        errors: [],
        blocks: [],
        functions: {},
      };
      const session = store.create(template);

      expect(session.state.useTemplate).toBeDefined();
      expect(session.state.useTemplate!.def).toEqual(template);
      expect(session.state.useTemplate!.blockIndex).toBe(0);
    });
  });

  describe("get", () => {
    it("should return null for non-existent session", () => {
      expect(store.get("nonexistent")).toBeNull();
    });

    it("should return existing session and update lastUsedAt", () => {
      const session = store.create();
      const originalDate = session.lastUsedAt;

      // Wait a bit to ensure new Date() gives different time
      setTimeout(() => {
        const retrieved = store.get(session.id);
        expect(retrieved).toBeDefined();
        expect(retrieved!.lastUsedAt.getTime()).toBeGreaterThan(
          originalDate.getTime()
        );
      }, 1);
    });
  });

  describe("set", () => {
    it("should update session properties", () => {
      const session = store.create();
      const newMessage: ChatMessage = { role: "user", content: "Hello" };

      store.set(session.id, {
        actualChat: [newMessage],
        appendToHistory: [newMessage],
      });

      const updated = store.get(session.id)!;
      expect(updated.actualChat).toEqual([newMessage]);
      expect(updated.fullHistory).toEqual([newMessage]);
    });

    it("should throw error for non-existent session", () => {
      expect(() => store.set("nonexistent", {})).toThrow("Session not found");
    });
  });

  describe("variables", () => {
    it("should set and get variables", () => {
      const session = store.create();
      store.setVariable(session.id, "testKey", "testValue");

      expect(store.getVariable(session.id, "testKey")).toBe("testValue");
    });

    it("should throw error when getting non-existent session", () => {
      expect(() => store.getVariable("nonexistent", "key")).toThrow(
        "Session not found"
      );
    });
  });

  describe("memory", () => {
    it("should append to memory", () => {
      const session = store.create();
      store.appendToMemory(session.id, "testMemory", "value1");
      store.appendToMemory(session.id, "testMemory", "value2");

      const updated = store.get(session.id)!;
      expect(updated.state.variables["testMemory"]).toEqual([
        "value1",
        "value2",
      ]);
    });
  });

  describe("cleanup", () => {
    it("should remove expired sessions", () => {
      // Mock Date.now() to control time
      const realDate = Date;
      const currentTime = new Date("2024-01-01").getTime();

      global.Date = class extends Date {
        constructor() {
          super();
          return new realDate(currentTime);
        }
      } as DateConstructor;

      const store = new ChatHistoryStore(1); // 1 hour max age
      const session = store.create();

      // Advance time by 2 hours
      global.Date = class extends Date {
        constructor() {
          super();
          return new realDate(currentTime + 2 * 60 * 60 * 1000);
        }
      } as DateConstructor;

      store.cleanup();
      expect(store.get(session.id)).toBeNull();

      // Restore original Date
      global.Date = realDate;
    });
  });
});
