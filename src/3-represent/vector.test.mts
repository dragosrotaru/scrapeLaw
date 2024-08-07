import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { vectorizeCorpus } from "./vector.mts";

Deno.test("vectorizeCorpus should return vectorized representation of HTML corpus", () => {
  const input = [`<div class="test">Hello <span>world</span></div>`];
  const [maps, vectorized] = vectorizeCorpus(input);

  assertEquals(vectorized.length, 1);
  assertEquals(vectorized[0].length, 7);

  assertEquals(
    Array.from(maps.structuralMap.keys()).sort(),
    [`<div class >`, `<span>`, `</div>`, `</span>`].sort()
  );

  assertEquals(Array.from(maps.contentMap.keys()), ["test", "Hello", "world"]);
});
