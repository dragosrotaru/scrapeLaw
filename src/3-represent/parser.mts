const OPEN = "<";
const CLOSE = ">";
const SLASH = "/";
const DOUBLE_QUOTE = '"';
const SINGLE_QUOTE = "'";
const EQUALS = "=";

/**
 * Takes a string of potentially invalid html and returns a list of lexer tokens
 * @param strings
 * @returns
 */
export function lexer(html: string): string[] {
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
export function isLexedTag(token: string): boolean {
  return token.startsWith(OPEN) && token.endsWith(CLOSE);
}

/**
 * simple textual content tokenization by splitting on whitespace
 * @param token
 * @returns
 */
export function parseContent(text: string): string[] {
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

  function parseAttributes(attributeString: string) {
    const attributes: { name: string; value?: string }[] = [];
    const regex =
      /(?:\s|^)([\w:.-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let match: RegExpExecArray | null = null;
    while ((match = regex.exec(attributeString)) !== null) {
      const [_, name, doubleQuotedValue, singleQuotedValue, unquotedValue] =
        match;
      const value = doubleQuotedValue || singleQuotedValue || unquotedValue;
      if (name.startsWith("on")) continue; // ignore event handlers containing javascript
      if (value.startsWith("javascript:")) continue; // ignore hrefs containing javascript
      attributes.push({ name, value });
    }
    console.log(attributes);
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
