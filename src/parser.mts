const OPEN = "<";
const CLOSE = ">";
const SLASH = "/";
const DOUBLE_QUOTE = '"';
const SINGLE_QUOTE = "'";
const EQUALS = "=";

/**
 * Applies a series of regex replacements to a string
 * @param html
 * @param regex
 * @returns
 */
export const replaceRegex = (html: string, regex: [RegExp, string][]) => {
  for (const [r, s] of regex) {
    html = html.replace(r, s);
  }
  return html;
};

/**
 * extract-safe html normalization
 * @param html
 * @returns
 */
export function normHTMLExtract(html: string): string {
  // normalize whitespace, /t, /n, /r, etc.
  return html.replace(/\s+/g, " ").trim();
}

/**
 * parse-safe html normalization
 * @param html
 * @returns
 */
export function normHTMLParse(html: string) {
  // todo handle uppercase tags
  html = replaceRegex(html, [
    [/<script[\w\W\n\s]+?<\/script>/g, ""], // remove scripts, because scripts can contain html or lt/gt characters
    [/<style[\w\W\n\s]+?<\/style>/g, ""], // remove style tags for the same reason
    [/<svg[\w\W\n\s]+?<\/svg>/g, ""], // remove svg tags for the same reason
    [/<svg[\w\W\n\s]+?\/>/g, ""],
    [/<math[\w\W\n\s]+?<\/math>/g, ""], // remove math tags for the same reason
    [/<math[\w\W\n\s]+?\/>/g, ""],
    [/<title[\w\W\n\s]+?<\/title>/g, ""], // remove title tags for the same reason
    [/<textarea[\w\W\n\s]+?<\/textarea>/g, ""], // remove textarea tags for the same reason
    [/<textarea[\w\W\n\s]+?\/>/g, ""],
    [/<\!\[CDATA\[[\w\W\n\s]+?\]\]>/g, ""], // remove cdata for the same reason
    [/(<!--.*?-->)|(<!--[\w\W\n\s]+?-->)/g, ""], // remove comments for the same reason
    [/\s+/g, " "], // normalize whitespace, /t, /n, /r, etc.
    [/>\s+</g, "><"], // remove whitespace between tags
  ]);

  // todo normalize all attributes to use double quotes, including quoteless attributes

  // remove trailing whitespace
  return html.trim();
}

/**
 * Takes a string of potentially invalid html and returns a list of lexer tokens
 * @param strings
 * @returns
 */
export function lexer(originalHTML: string): string[] {
  const html = normHTMLParse(originalHTML);
  const result: string[] = [];
  let current = "";
  let insideAttribute: typeof DOUBLE_QUOTE | typeof SINGLE_QUOTE | false =
    false;

  for (let index = 0; index < html.length; index++) {
    let insideTag = current.startsWith(OPEN);
    const char = html[index];
    if (char === OPEN) {
      // inside a tag
      if (insideTag) {
        throw new Error("unexpected less than sign");
      }

      // end of a text block
      if (!insideTag && current !== "") {
        result.push(current);
        current = "<";
        continue;
      }

      // base case: start of a new tag
      if (current === "") {
        current = OPEN;
        continue;
      }
    } else if (char === CLOSE) {
      // inside an attribute
      if (insideAttribute) {
        current += char;
        continue;
      }

      // base case: end of a tag
      if (insideTag) {
        current = current + CLOSE;
        result.push(current);
        current = "";
        continue;
      }

      // treat as text
      current += char;
    } else if (char === DOUBLE_QUOTE) {
      // inside an attribute
      if (insideAttribute === DOUBLE_QUOTE) {
        insideAttribute = false;
        current += char;
        continue;
      }

      // base case: start of an attribute
      if (insideAttribute === false && insideTag) {
        if (current.endsWith(EQUALS)) {
          insideAttribute = DOUBLE_QUOTE;
          current += char;
          continue;
        }
        throw new Error("unexpected quote");
      }

      // treat as text
      current += char;
    } else if (char === SINGLE_QUOTE) {
      // inside an attribute
      if (insideAttribute === SINGLE_QUOTE) {
        insideAttribute = false;
        current += char;
        continue;
      }

      // base case: start of an attribute
      if (insideAttribute === false && insideTag) {
        if (current.endsWith(EQUALS)) {
          insideAttribute = SINGLE_QUOTE;
          current += char;
          continue;
        }
        throw new Error("unexpected quote");
      }

      // treat as text
      current += char;
    } else {
      current += char;
    }
  }
  if (current !== "") {
    result.push(current);
  }
  return result;
}

/**
 * returns whether a lexed token is a tag
 * @param token
 * @returns
 */
export function isLexedTag(token: string) {
  return token.startsWith(OPEN) && token.endsWith(CLOSE);
}

/**
 * simple textual content tokenization by splitting on whitespace
 * @param token
 * @returns
 */
export function parseContent(text: string) {
  return text.trim().split(" ");
}

/**
 * A Tag IR Object
 */
export type Tag = {
  name: string;
  attributes: { name: string; value?: string }[];
  type: "open" | "close" | "self-closing";
};

/**
 * Parses a lexed html tag into an IR Tag object
 * @param token
 * @returns
 */
export function parseTag(token: string): Tag {
  if (!isLexedTag(token)) {
    throw new Error("invalid tag");
  }

  // Remove < and > from the start and end
  token = token.slice(1, -1).trim();

  // Check if it's a closing tag
  if (token.startsWith(SLASH)) {
    return normTag({
      name: token.slice(1).trim(),
      attributes: [],
      type: "close",
    });
  }

  // Check if it's a self-closing tag
  const selfClosing = token.endsWith(SLASH);
  if (selfClosing) {
    token = token.slice(0, -1).trim();
  }

  // Extract name and attribute string
  const matches = token.match(/^(\S+)([\s\S]*)/);
  if (!matches) {
    throw new Error("Invalid tag format");
  }

  const [, name, attributeString] = matches;

  function parseAttributes(attributeString) {
    const attributes: { name: string; value?: string }[] = [];
    const regex = /(?:\s|^)(\w+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let match;

    while ((match = regex.exec(attributeString)) !== null) {
      const [, name, doubleQuotedValue, singleQuotedValue, unquotedValue] =
        match;
      const value =
        doubleQuotedValue || singleQuotedValue || unquotedValue || "";
      attributes[name] = value;
      attributes.push({ name, value });
    }

    return attributes;
  }

  // Parse attributes
  const attributes = parseAttributes(attributeString);

  return normTag({
    name,
    attributes,
    type: selfClosing ? "self-closing" : "open",
  });
}

/**
 * Normalizes a tag object for the purpose of comparison
 * @param tag
 * @returns
 */
export function normTag(tag: Tag): Tag {
  return {
    name: tag.name.toLowerCase(),
    attributes: tag.attributes
      .map(({ name, value }) => ({ name: name.toLowerCase(), value: value }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    type: tag.type,
  };
}

/**
 * Converts a tag object into an IR token
 * @param tag
 * @returns
 */
export function tagToToken(tag: Tag): string {
  const attributeNames = tag.attributes.map(({ name, value }) => name);
  if (tag.type === "open")
    return attributeNames.length === 0
      ? `<${tag.name}>`
      : `<${tag.name} ${attributeNames.join(" ")} >`;
  else if (tag.type === "close") return `</${tag.name}>`;
  else
    return attributeNames.length === 0
      ? `<${tag.name} />`
      : `<${tag.name} ${attributeNames.join(" ")} />`;
}

/**
 * Parses a string of html into a list of IR tokens
 * @param html
 * @returns
 */
export function parser(html: string): string[] {
  const result: string[] = [];
  const parsedHTML = lexer(html);
  for (const token of parsedHTML) {
    if (isLexedTag(token)) {
      let tag = parseTag(token);
      const tagToken = tagToToken(tag);
      result.push(tagToken);
      for (const attribute of tag.attributes) {
        if (attribute.value) {
          const attributeTokens = parseContent(attribute.value);
          result.push(...attributeTokens);
        }
      }
    } else {
      const tokens = parseContent(token);
      result.push(...tokens);
    }
  }
  return result;
}

/**
 * Takes a corpus of html strings and returns a custom vector representation
 * of the corpus, along with dictionaries for the structural and content
 * tokens, for the purpose of selecting a sample of the corpus in a web scraping
 * context
 * @param corpus
 * @returns
 */
export function vectorizeCorpus(corpus: string[]): {
  structuralDictionary: Map<string, number>;
  contentDictionary: Map<string, number>;
  vectorized: number[][];
} {
  const structuralDictionary = new Map<string, number>();
  let structuralIndex = 1;
  const contentDictionary = new Map<string, number>();
  let contentIndex = 2;
  const vectorized: number[][] = [];

  for (const html of corpus) {
    const tokens = parser(html);
    const sampleVector: number[] = [];
    for (const token of tokens) {
      if (isLexedTag(token)) {
        if (!structuralDictionary.has(token)) {
          structuralDictionary.set(token, structuralIndex);
          sampleVector.push(structuralIndex);
          structuralIndex = structuralIndex + 2;
        } else {
          sampleVector.push(structuralDictionary.get(token)!);
        }
      } else {
        if (!contentDictionary.has(token)) {
          contentDictionary.set(token, contentIndex);
          sampleVector.push(contentIndex);
          contentIndex = contentIndex + 2;
        } else {
          sampleVector.push(contentDictionary.get(token)!);
        }
      }
    }
    vectorized.push(sampleVector);
  }

  return { structuralDictionary, contentDictionary, vectorized };
}

/**
 * Generates frequency maps for structural and content tokens based on the vectorized corpus
 * @param result Output from vectorizeCorpus function
 * @returns Object containing frequency maps for structural and content tokens
 */
export function generateFrequencyMaps(result: {
  structuralDictionary: Map<string, number>;
  contentDictionary: Map<string, number>;
  vectorized: number[][];
}): {
  structuralFrequency: Map<string, number>;
  contentFrequency: Map<string, number>;
} {
  const { structuralDictionary, contentDictionary, vectorized } = result;

  const structuralFrequency = new Map<string, number>();
  const contentFrequency = new Map<string, number>();

  // Count tokens for each item in the corpus
  for (const sampleVector of vectorized) {
    const uniqueStructuralTokens = new Set<string>();
    const uniqueContentTokens = new Set<string>();

    for (const tokenIndex of sampleVector) {
      if (tokenIndex % 2 === 1) {
        // Structural token
        const token = getKeyByValue(structuralDictionary, tokenIndex);
        if (token) uniqueStructuralTokens.add(token);
      } else {
        // Content token
        const token = getKeyByValue(contentDictionary, tokenIndex);
        if (token) uniqueContentTokens.add(token);
      }
    }

    // Update frequency maps
    for (const token of uniqueStructuralTokens) {
      structuralFrequency.set(token, (structuralFrequency.get(token) || 0) + 1);
    }
    for (const token of uniqueContentTokens) {
      contentFrequency.set(token, (contentFrequency.get(token) || 0) + 1);
    }
  }

  // normalize the frequency maps
  const totalSamples = vectorized.length;
  for (const [token, count] of structuralFrequency.entries()) {
    structuralFrequency.set(token, count / totalSamples);
  }
  for (const [token, count] of contentFrequency.entries()) {
    contentFrequency.set(token, count / totalSamples);
  }

  return { structuralFrequency, contentFrequency };
}

/**
 * Converts a vector to its text representation, omitting zero components
 * @param vector A vector from the corpus
 * @param result Output from vectorizeCorpus function
 * @returns A string representation of the vector, with zero components omitted
 */
export function vectorToText(
  vector: number[],
  result: {
    structuralDictionary: Map<string, number>;
    contentDictionary: Map<string, number>;
  }
): (string | null)[] {
  const { structuralDictionary, contentDictionary } = result;

  const textComponents = vector.map((tokenIndex) => {
    if (tokenIndex === 0) {
      return null; // Will be filtered out later
    }

    if (tokenIndex % 2 === 1) {
      // Structural token
      const token = getKeyByValue(structuralDictionary, tokenIndex);
      return token ? token : `[Unknown Structural Token ${tokenIndex}]`;
    } else {
      // Content token
      const token = getKeyByValue(contentDictionary, tokenIndex);
      return token ? token : `[Unknown Content Token ${tokenIndex}]`;
    }
  });
  return textComponents;
}

/**
 * Shortens a vector by reducing consecutive zero components to a single zero
 * @param vector
 * @returns
 */
export function compressZeroComponents(vector: number[]): number[] {
  return vector.reduce<number[]>((acc, current) => {
    if (current === 0 && acc[acc.length - 1] === 0) {
      return acc;
    }
    return [...acc, current];
  }, []);
}

// Helper function to get a key by its value in a Map (reused from previous examples)
function getKeyByValue(map: Map<string, number>, value: number): string {
  for (const [key, val] of map.entries()) {
    if (val === value) return key;
  }
  throw new Error("Key not found");
}

/**
 * Creates a new vector with infrequent tokens zeroed out
 * @param vector A vector from the corpus
 * @param result Output from vectorizeCorpus function
 * @param frequencyMaps Output from generateFrequencyMaps function
 * @returns A new vector with frequent tokens zeroed out
 */
export function zeroOutFrequentTokens(
  vector: number[],
  result: {
    structuralDictionary: Map<string, number>;
    contentDictionary: Map<string, number>;
    vectorized: number[][];
  },
  frequencyMaps: {
    structuralFrequency: Map<string, number>;
    contentFrequency: Map<string, number>;
  },
  param: number
): number[] {
  const { structuralDictionary, contentDictionary } = result;
  const { structuralFrequency, contentFrequency } = frequencyMaps;

  return vector.map((tokenIndex) => {
    if (tokenIndex % 2 === 1) {
      // Structural token
      const token = getKeyByValue(structuralDictionary, tokenIndex);
      if (structuralFrequency.get(token)! > param) {
        return 0;
      }
    } else {
      // Content token
      const token = getKeyByValue(contentDictionary, tokenIndex);
      if (contentFrequency.get(token)! > param) {
        return 0;
      }
    }
    return tokenIndex;
  });
}

export function generateFrequencyVector(
  vector: number[],
  result: ReturnType<typeof vectorizeCorpus>,
  freqMaps: ReturnType<typeof generateFrequencyMaps>
): number[] {
  const { structuralFrequency, contentFrequency } = freqMaps;
  const frequencyVector = vector.map((tokenIndex) => {
    if (tokenIndex % 2 === 1) {
      // Structural token
      const token = getKeyByValue(result.structuralDictionary, tokenIndex);
      return structuralFrequency.get(token)!;
    } else {
      // Content token
      const token = getKeyByValue(result.contentDictionary, tokenIndex);
      return contentFrequency.get(token)!;
    }
  });
  return frequencyVector;
}
