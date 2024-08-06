import { assertEquals, assertThrows } from "https://deno.land/std/testing/asserts.ts";
import {
  lexer,
  parseTag,
  tagToToken,
  parser,
  isLexedTag,
  parseContent,
  Tag,
} from "./parser.mts";

Deno.test("lexer should tokenize HTML string", () => {
  const input = `<div class="test">Hello <span>world</span></div>`;
  const expected = [
    `<div class="test">`,
    "Hello ",
    `<span>`,
    "world",
    `</span>`,
    `</div>`,
  ];
  assertEquals(lexer(input), expected);
});

Deno.test("parseTag should parse a tag correctly", () => {
  const input = `<div class="test" data-id='123'>`;
  const expected: Tag = {
    name: "div",
    attributes: [
      { name: "class", value: "test" },
      { name: "data-id", value: "123" },
    ],
    type: "open",
  };
  assertEquals(parseTag(input), expected);
});

Deno.test("tagToToken should convert a tag object to a IR token", () => {
  const input: Tag = {
    name: "div",
    attributes: [{ name: "class", value: "test" }],
    type: "open",
  };
  const expected = `<div class >`;
  assertEquals(tagToToken(input), expected);
});

Deno.test("parser should parse HTML into IR tokens", () => {
  const input = `<div class="test">Hello <span>world</span></div>`;
  const expected = [
    `<div class >`,
    "test",
    "Hello",
    `<span>`,
    "world",
    `</span>`,
    `</div>`,
  ];
  assertEquals(parser(input), expected);
});

Deno.test("isLexedTag should identify if a token is a tag", () => {
  assertEquals(isLexedTag("<div>"), true);
  assertEquals(isLexedTag("Hello"), false);
});

Deno.test("parseContent should split text content on whitespace", () => {
  const input = "Hello world";
  const expected = ["Hello", "world"];
  assertEquals(parseContent(input), expected);
});

Deno.test("lexer should throw error on unexpected less than sign", () => {
  const input = "<div> < <span>";
  assertThrows(() => lexer(input), Error, "unexpected less than sign");
});
