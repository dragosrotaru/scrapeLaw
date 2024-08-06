import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { normHTMLExtract, normHTMLParse } from "./html.mts";

Deno.test("normHTMLExtract should normalize whitespace", () => {
  const input = "  <div>\n\t<p> Text </p>  </div> ";
  const expected = "<div> <p> Text </p> </div>";
  assertEquals(normHTMLExtract(input), expected);
});

Deno.test(
  "normHTMLParse should remove script tags and normalize whitespace",
  () => {
    const input = `<div> <script>var x = 1;</script> <p> Text </p> </div>`;
    const expected = "<div><p> Text </p></div>";
    assertEquals(normHTMLParse(input), expected);
  }
);