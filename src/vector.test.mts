import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { vectorizeCorpus } from "./vector.mts";

Deno.test("vectorizeCorpus should return vectorized representation of HTML corpus", () => {
  const input = [`<div class="test">Hello <span>world</span></div>`];
  const result = vectorizeCorpus(input);

  assertEquals(result.vectorized.length, 1);
  assertEquals(result.vectorized[0].length, 7);

  assertEquals(
    Array.from(result.structuralMap.keys()).sort(),
    [`<div class >`, `<span>`, `</div>`, `</span>`].sort()
  );

  assertEquals(Array.from(result.contentMap.keys()), ["test", "Hello", "world"]);
});
