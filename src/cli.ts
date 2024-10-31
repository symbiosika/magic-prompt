import { parseTemplateRaw } from "./index";
import { readFileSync, writeFileSync } from "fs";

const main = async () => {
  // Get input file path from command line arguments
  const inputFile = process.argv[2];

  if (!inputFile) {
    console.error("Please provide an input file path");
    process.exit(1);
  }

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
  } catch (error) {
    console.error("Error:", error + "");
    process.exit(1);
  }
};

main();
