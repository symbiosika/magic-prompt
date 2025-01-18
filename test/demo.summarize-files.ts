import { promises as fsPromises } from "fs";
import { TemplateChat } from "../src/template-chat-class";
import { standardSingleLineParsers } from "../src/standard-parsers";
import {
  PlaceholderArgumentDict,
  PlaceholderParser,
  VariableDictionaryInMemory,
} from "../src/types";
import { getResponseFromOpenAi } from "../src/demo-llm-warpper";
import { parseTemplate } from "../src/generate-logic";
import { appendToLog } from "./logger";
import { isNumber } from "./utils";

const chatTemplate = `
{{#init y=99}}

{{#block
  name=extract_facts
  next=extract_facts
  max_tokens=300
  output=last_fact
  memory=extracted_facts
  allow_user_skip=true
}}
{{#role=system}}
{{#init x=99}}
Du bist ein Assistent der einen Text mit Fakten bekommt.
Du wirst alle Fakten sauber und neutral extrahieren und als neutralen Text zurückgeben.
Format:
- Fakt 1: ...
- Fakt 2: ...
- Fakt 3: ...
- ...
Es gibt keine Überschrift etc. Keine weiteren Informationen oder Formatierungen oder Kommentare.
{{/role}} 

{{#role=user}}
{{#file_content}}
{{/role}}

{{/block}}

{{#block
  name=aggregate_facts
  next=aggregate_facts  
  clear_on_start=true
  max_tokens=4000
  output=facts_summary
  memory=facts_summary_memory
  allow_user_skip=true
}}
{{#role=system}}
Du bist ein Assistent Wissen aggregiert.
Du bekommt einen Quelltext mit Fakten.
Außerdem hast du einen aktuellen Stand mit Fakten.
Du ergänzt diese mit dem Quellwissen.

- Neues Wissen wird hinzugefügt.
- Altes Wissen bleibt vorhanden oder wird ergänzt.
- Wenn sich Fakten widersprechen, wird das neue Wissen beibehalten.
- Wenn sich Fakten nicht widersprechen, wird das neue Wissen hinzugefügt.

Du wirst alle Fakten sauber und neutral extrahieren und als neutralen Text zurückgeben.
Format:
- Fakt 1: ...
- Fakt 2: ...
- Fakt 3: ...
- ...
Es gibt keine Überschrift etc. Keine weiteren Informationen oder Formatierungen oder Kommentare.
{{/role}} 

{{#role=user}}
Aktueller Stand:
{{facts_summary}}

Neue Fakten zum aggregieren:
{{#memory_value name=extracted_facts}}
{{/role}}

{{/block}}
`;

export const demoPlaceholderParsers: PlaceholderParser[] = [
  {
    name: "file_content",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: VariableDictionaryInMemory
    ): Promise<{
      content: string;
      skipThisBlock?: boolean;
    }> => {
      if (!variables["inner_cnt"]) {
        variables["inner_cnt"] = 1;
      } else {
        variables["inner_cnt"] = Number(variables["inner_cnt"]) + 1;
      }
      console.log("STAND", variables["inner_cnt"]);

      if (variables["inner_cnt"] > 3) {
        return {
          content: "",
          skipThisBlock: true,
        };
      } else {
        const file = `test/textes/text-0${variables["inner_cnt"]}.txt`;
        const fileContent = await fsPromises.readFile(file, "utf-8");
        return {
          content: fileContent,
          skipThisBlock: false,
        };
      }
    },
  },
  {
    name: "inc_value",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: VariableDictionaryInMemory
    ) => {
      if (!args.variable) {
        throw new Error(
          "variable parameter is required for inc_value placeholder"
        );
      }
      const varName = args.variable + "";
      const actualValue: number = isNumber(variables[varName]) ?? 0;
      const increaseBy: number = isNumber(args.increase) ?? 1;

      variables[varName] = actualValue + increaseBy;
      return { content: "" };
    },
  },
  {
    name: "memory_value",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: VariableDictionaryInMemory
    ) => {
      // get name of the array variable
      if (!args.name) {
        console.error(
          "name parameter is required for memory_value placeholder"
        );
        return { content: "" };
      }

      const varName = args.name + "";
      if (!variables[varName] || !Array.isArray(variables[varName])) {
        console.error("variable not found", varName);
        return { content: "" };
      }

      const ixName = args.index ? args.index + "" : "ix_" + varName;
      if (!variables[ixName]) {
        variables[ixName] = 0;
      }

      // get value from array
      if (Number(variables[ixName]) >= variables[varName].length) {
        return { content: "", skipThisBlock: true };
      }

      // read value
      const val = variables[varName][Number(variables[ixName])];
      // increment index
      variables[ixName] = Number(variables[ixName]) + 1;
      return { content: val + "" };
    },
  },
];

(async () => {
  console.log("Starting chat...");
  const parsedTemplate = await parseTemplate(chatTemplate, {
    placeholderParsers: demoPlaceholderParsers,
  });
  await fsPromises.writeFile(
    "test/demo.summarize-files.parsed-template.json",
    JSON.stringify(parsedTemplate, null, 2)
  );
  const templateChat = new TemplateChat({
    singleLineParsers: standardSingleLineParsers,
    placeholderParsers: demoPlaceholderParsers,
    llmWrapper: getResponseFromOpenAi,
    logger: appendToLog,
    loopLimit: 10,
  });

  // Start initial chat
  let chatResponse = await templateChat.chat({
    template: parsedTemplate,
    chatId: "jHszfSwlHd",
    userMessage: "",
    llmOptions: {
      model: "gpt-4-turbo",
    },
  });

  console.log("chatResponse", chatResponse.result.message.content);
  await fsPromises.writeFile(
    "test/textes/facts_summary.txt",
    chatResponse.result.message.content
  );

  process.exit(0);
})();
