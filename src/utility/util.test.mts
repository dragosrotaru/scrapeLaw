import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { replaceRegex } from "./util.mts";

Deno.test("replaceRegex should apply a series of regex replacements", () => {
  const input = "Hello    world!";
  const replacements: [RegExp, string][] = [[/\s+/g, " "]];
  const expected = "Hello world!";
  assertEquals(replaceRegex(input, replacements), expected);
});
