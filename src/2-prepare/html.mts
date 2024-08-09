// Utility
import { replaceRegex } from "../utility/util.mts";

/**
 * html whitespace normalization
 * @param html
 * @returns
 */
export function normHTMLWhiteSpace(html: string): string {
  return replaceRegex(html, [
    [/\s+/g, " "], // normalize whitespace, /t, /n, /r, etc.
    [/>\s+</g, "><"], // remove whitespace between tags
  ]).trim(); // remove trailing whitespace
}

/**
 * parser-safe html normalization
 * @param html
 * @returns
 */
export function normHTMLParse(
  html: string,
  removeHead: boolean = true
): string {
  // remove scripts, style, svg, math, title, textarea, CDATA and comments
  // because scripts can contain html or lt/gt characters
  const regexArray: [RegExp, string][] = [
    [/<script[\w\W\n\s]+?<\/script>/g, ""],
    [/<style[\w\W\n\s]+?<\/style>/g, ""],
    [/<svg[\w\W\n\s]+?<\/svg>/g, ""],
    [/<svg[\w\W\n\s]+?\/>/g, ""],
    [/<math[\w\W\n\s]+?<\/math>/g, ""],
    [/<math[\w\W\n\s]+?\/>/g, ""],
    [/<title[\w\W\n\s]+?<\/title>/g, ""],
    [/<textarea[\w\W\n\s]+?<\/textarea>/g, ""],
    [/<textarea[\w\W\n\s]+?\/>/g, ""],
    [/<\!\[CDATA\[[\w\W\n\s]+?\]\]>/g, ""],
    [/(<!--.*?-->)|(<!--[\w\W\n\s]+?-->)/g, ""],
  ];
  if (removeHead) {
    // add to front of array for efficiency
    regexArray.unshift([/<head[\w\W\n\s]+?<\/head>/g, ""]); // remove head tags
  }

  return replaceRegex(html, regexArray);
}
