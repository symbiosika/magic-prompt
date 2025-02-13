import { describe, it, expect, beforeEach } from "bun:test";
import { ChatHistoryStoreInMemory } from "./immemory-chat-history";
import { ChatMessage, ParsedTemplateBlocks } from "./types";

const store = new ChatHistoryStoreInMemory(48);

describe("ChatHistoryStore", () => {
  describe("create", () => {
    it("should create a new chat session without template", async () => {
      const session = await store.create();

      expect(session.id).toBeDefined();
      expect(session.id.length).toBe(16);
      expect(session.actualChat).toEqual([]);
      expect(session.fullHistory).toEqual([]);
      expect(session.state.useTemplate).toBeUndefined();
      expect(session.state.variables).toEqual({});
    });

    it("should create a new chat session with template", async () => {
      const template: ParsedTemplateBlocks = {
        errors: [],
        blocks: [],
        functions: {},
      };
      const session = await store.create({ useTemplate: template });

      expect(session.state.useTemplate).toBeDefined();
      expect(session.state.useTemplate!.def).toEqual(template);
      expect(session.state.useTemplate!.blockIndex).toBe(0);
    });
  });

  describe("get", () => {
    it("should return null for non-existent session", async () => {
      expect(await store.get("nonexistent")).toBeNull();
    });

    it("should return existing session and update lastUsedAt", async () => {
      const session = await store.create();
      const originalDate = session.lastUsedAt;

      // Wait a bit to ensure new Date() gives different time
      setTimeout(async () => {
        // console.log(session.id);
        const retrieved = await store.get(session.id);
        if (!retrieved) {
          throw new Error("Session not found");
        }
        expect(retrieved).toBeDefined();
        expect(retrieved.lastUsedAt.getTime()).toBeGreaterThan(
          originalDate.getTime()
        );
      }, 100);
    });
  });

  describe("set", () => {
    it("should update session properties", async () => {
      const session = await store.create();
      const newMessage: ChatMessage = { role: "user", content: "Hello" };

      await store.set(session.id, {
        actualChat: [newMessage],
        appendToHistory: [newMessage],
      });

      const updated = (await store.get(session.id))!;
      expect(updated.actualChat).toEqual([newMessage]);
      expect(updated.fullHistory).toEqual([newMessage]);
    });

    it("should throw error for non-existent session", () => {
      expect(() => store.set("nonexistent", {})).toThrow("Session not found");
    });
  });

  describe("variables", () => {
    it("should set and get variables", async () => {
      const session = await store.create();
      await store.setVariable(session.id, "testKey", "testValue");

      expect(await store.getVariable(session.id, "testKey")).toBe("testValue");
    });

    it("should throw error when getting non-existent session", () => {
      expect(() => store.getVariable("nonexistent", "key")).toThrow(
        "Session not found"
      );
    });
  });

  describe("memory", () => {
    it("should append to memory", async () => {
      const session = await store.create();
      await store.appendToMemory(session.id, "testMemory", "value1");
      await store.appendToMemory(session.id, "testMemory", "value2");

      const updated = (await store.get(session.id))!;
      expect(updated.state.variables["testMemory"]).toEqual([
        "value1",
        "value2",
      ]);
    });
  });

  describe("cleanup", () => {
    it("should remove expired sessions", async () => {
      // Mock Date.now() to control time
      const realDate = Date;
      const currentTime = new Date("2024-01-01").getTime();

      global.Date = class extends Date {
        constructor() {
          super();
          return new realDate(currentTime);
        }
      } as DateConstructor;

      const store = new ChatHistoryStoreInMemory(1); // 1 hour max age
      const session = await store.create();

      // Advance time by 2 hours
      global.Date = class extends Date {
        constructor() {
          super();
          return new realDate(currentTime + 2 * 60 * 60 * 1000);
        }
      } as DateConstructor;

      await store.cleanup(); // Ensure cleanup is awaited
      expect(await store.get(session.id)).toBeNull(); // Await the get call

      // Restore original Date
      global.Date = realDate;
    });
  });
});
