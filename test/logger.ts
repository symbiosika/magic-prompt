import { TemplateChatLogger } from "../src/types";
import { promises as fsPromises } from "fs";

const log = async (...items: any[]): Promise<void> => {
  const formattedMessage =
    items
      .map((msg) =>
        typeof msg === "object" ? JSON.stringify(msg, null, 2) : String(msg)
      )
      .join(" ") + "\n";
  await fsPromises.appendFile("chat.log", formattedMessage);
  return;
};

export const appendToLog: TemplateChatLogger = {
  debug: log,
  info: log,
  error: log,
};
