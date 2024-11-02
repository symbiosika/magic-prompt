import { parseTemplateToBlocks } from "./generate-logic";
import { parseTemplateRaw } from "./index";
import { readFileSync, writeFileSync } from "fs";

const main = async () => {
  // Get input file path from command line arguments
  const mode = process.argv[2];
  const inputFile = process.argv[3];

  if (!inputFile) {
    console.error("Please provide an input file path");
    process.exit(1);
  }

  if (mode === "raw") {
    try {
      // Read the input file
      const content = readFileSync(inputFile, "utf-8");

      // Parse the template
      const template = await parseTemplateRaw(content);

      // Generate output file name by appending .template.json
      const outputFile = `${inputFile}.template.json`;

      // Save the parsed template as JSON
      writeFileSync(outputFile, JSON.stringify(template, null, 2));

      console.log(`Template saved to ${outputFile}`);
      process.exit(0);
    } catch (error) {
      console.error("Error:", error + "");
      process.exit(1);
    }
  } else if (mode === "parse") {
    try {
      // Read the input file
      const content = readFileSync(inputFile, "utf-8");

      // Parse the template
      const template = await parseTemplateRaw(content);
      const parsedTemplate = parseTemplateToBlocks(template);

      // Generate output file name by appending .template.json
      const outputFile = `${inputFile}.template.json`;

      // Save the parsed template as JSON
      writeFileSync(outputFile, JSON.stringify(parsedTemplate, null, 2));

      console.log(`Template saved to ${outputFile}`);
      process.exit(0);
    } catch (error) {
      console.error("Error:", error + "");
      process.exit(1);
    }
  }
};

main();
