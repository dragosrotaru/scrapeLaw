import OpenAI from "openai";
import type { NullableString } from "./types.mts";

const openai = new OpenAI({
  apiKey: "REDACTED_OPENAI_API_KEY",
});

/**
 * Uses the OpenAI chat api to return a chat completion
 * @param prompt 
 * @returns 
 */
async function llmCompletion(prompt: string): Promise<NullableString> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini-2024-07-18",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ],
  });
  return response.choices[0].message.content;
}

/**
 * Generates Code block matching regex
 * @param language 
 * @returns 
 */
const codeBlockRegex = (language: string) =>
    new RegExp(`\`\`\`${language}([\\s\\S]+?)\`\`\``);

/**
 * Matches a code block regex
 * @param regex 
 * @param string 
 * @returns 
 */
const matchRegex = (regex: RegExp, string: string) => {
    const match = string.match(regex);
    if (match && match.length > 1) {
        // match[0] includes the code block itsel
        return match[1];
    }
    return null;
};

/**
 * Extracts the first code block matching one of the languages provided
 * from a string, or the entire string if no code block is found
 * @param input 
 * @param language 
 * @returns 
 */
const extractFirstCodeBlock = (input: string, language: string[]) => {
    for (const lang of language) {
        const code = matchRegex(codeBlockRegex(lang), input);
        if (code) {
            return { code, language: lang };
        }
    }
    return { code: input, language: null };
};

/**
 * Prompts OpenAI and returns JSON data
 * @param prompt 
 * @returns 
 */
export async function extractJSON(prompt: string): Promise<any> {
  const response = await llmCompletion(prompt);
  if (response === null) {
    throw new Error("Failed to extract JSON data");
  }
  const json = JSON.parse(extractFirstCodeBlock(response, ["json"]).code);
  return json;
}

/**
 * Uses OpenAI API to solve simple captcha images
 * @param {*} image
 */
export async function captchaSolver(base64Image: string): Promise<NullableString> {
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-2024-04-09",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "what alphanumeric characters do you see? return nothing other than the characters.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
  });
  return response.choices[0].message.content?.replace(/[^a-zA-Z0-9]/g, "") || null;
}
