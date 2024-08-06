// Utility
import { extractJSON } from "../utility/gpt.mts";

// Prior Step
import { represent } from "../3-represent/index.mts";

async function textToJSON(text: string[]): Promise<any> {
  const data = text.join(" ")
  const prompt = `
  Given the following schema: name, gender, practicingStatus, admissionYear, firmName (nullable), address (nullable), email (nullable), phone (nullable), fax (nullable), practiceAreas (nullable), languages (nullable)

  extract data. return no prose except JSON in a \`\`\`json\`\`\` code block:\n\n${data}`;
  return extractJSON(prompt);
}

 
/**
 * analyze a corpus and extract fields
 */
async function extract() {
  try {
    const text = represent();
    const json = await textToJSON(text);
    console.log("Extracted JSON:", JSON.stringify(json, null, 4));

  } catch (error) {
    console.error("Unexpected Error:", error);
  }
}

extract();
