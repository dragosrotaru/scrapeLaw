import { replaceRegex } from "../utility/util.mts";

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
export function normHTMLParse(html: string): string {
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
