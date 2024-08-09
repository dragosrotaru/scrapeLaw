// Global
import type { Representation } from "../interfaces.mts";

// Utility
import { extractJSON } from "../utility/gpt.mts";

// Previous Step
import { vectorToText } from "../3-represent/vector.mts";

async function textToJSON(text: string[]): Promise<any> {
  const data = text.join(" ");
  const prompt = `
  Given the following schema: name, gender, practicingStatus, admissionYear, firmName (nullable), address (nullable), email (nullable), phone (nullable), fax (nullable), practiceAreas (nullable), languages (nullable)

  extract data. return no prose except JSON in a \`\`\`json\`\`\` code block:\n\n${data}`;
  return extractJSON(prompt);
}

export function filterOutByText(tokens: string[]): string[] {
  const text: string[] = [];

  for (let index = 0; index < tokens.length; index++) {
    const textComp = tokens[index];
    // filter out URLs
    if (textComp.startsWith("http")) continue;
    if (textComp.startsWith("mailto:")) continue;

    text.push(textComp);
  }
  return text;
}

/**
 * analyze a corpus and extract fields
 */
async function extract(rep: Representation) {
  for (const [vector, _] of rep.output) {
    try {
      const text = filterOutByText(vectorToText(vector, rep.maps));
      const json = await textToJSON(text);
      console.log("Extracted JSON:", JSON.stringify(json, null, 4));
    } catch (error) {
      console.error("Unexpected Error:", error);
    }
  }
}