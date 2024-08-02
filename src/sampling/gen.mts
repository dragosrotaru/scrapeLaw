import fs from "fs";
import OpenAI from "openai";
import GPTTokenizer from "gpt3-tokenizer";
import z from "zod";
import { JSDOM } from "jsdom";

const openai = new OpenAI({
  apiKey: "REDACTED_OPENAI_API_KEY",
});

const tokenizer = new GPTTokenizer.default({ type: "gpt3" });
export const countTokens = (input) => tokenizer.encode(input).bpe.length;

const MAX_TOKENS = 32000;
const MODEL = "gpt-4-turbo-2024-04-09";

async function llm_completion(prompt) {
  const response = await openai.chat.completions.create({
    model: MODEL,
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

/* Prompt Structure */

function content_separator() {
  return "\n --- NEXT EXAMPLE --- \n";
}
function content_block(content) {
  return `-----START EXAMPLES-----\n${content}\n-----END EXAMPLES-----\n`;
}

const REQUIREMENTS = `
- DO NOT return prose.
- DO NOT enclose the returned code in quotes or a code block.
- DO NOT use any external dependencies except the ones explicitly mentioned.
- DO NOT make any import or require statements. assume all necessary dependencies are already imported
`;

function gen_isolate_prompt(sample) {
  return `
  your goal is to generate a simple function tailored to a particular set of similar html content
  which "cuts out" the main content from the rest of the html and returns it.

  please generate a nodejs javascript function named "isolate" which either uses Regex or JSDOM
  to parse the input html and output the smallest snippet of html containing the entirety of the main content
  in these sample html pages below.

  If its already the smallest snippet possible, return the snippet as is. Dont overthink this, Its just a simple 
  data size reduction function to minimize the tokens used in the next prompt.

  ${REQUIREMENTS}

  ${content_block(sample.join(content_separator()))}
  `;
}
function gen_schema_prompt(array) {
  return `
  please return a Zod schema that matches the content of the following samples of html. This schema will be used
  with an extraction function that outputs JSON to validate said output.

  - DO NOT introduce any structure not present in the samples. For example, if there is an address
  written as a single string, DO NOT split it into separate fields for street, city, province, postal code.
  - DO BE specific about the data types and constraints. For example, if a field is a phone number,
  email, date, or number, DO specify that. DO SPECIFY a Regex pattern if a field has a specific format.
  - DO NOT leave fields as optional if they are always present in the samples. If a field is empty, it should be null.
  - DO BE zealous about dates, phone numbers, emails, numbers and IDs.
  ${REQUIREMENTS}

  ${content_block(array.join(content_separator()))}
`;
}
const gen_extract_prompt = (schema) => (array) =>
  `
  please return a nodejs javascript function named "extract" which uses JSDOM or Regex
  to return data from a single html string like the samples below. The function should return an object
  complying with the schema below.

  ${REQUIREMENTS}

  ${schema}

  ${content_block(array.join(content_separator()))}
`;

const refine_extract_prompt = (fn, errors) => (array) =>
  `
  you previously provided me with the following extract function:

  ${fn}

  unfortunately, it does not work for all the samples. Below are all the errors that came up with source examples.
  Please fix ALL of the errors by refining or fixing the function.

  ${REQUIREMENTS}

  Errors:

  ${Object.entries(errors)
    .map(([error, { count, examples }]) => {
      return `Error: ${error} (count: ${count})
    
    Example Source:
    
    ${examples[0]}`;
    })
    .join("\n")}
`;

const refine_extract_prompt_two = (fn, schema, validated) => (array) =>
  `
  you previously provided me with the following extract function:

  ${fn}

  for the following schema you provided:

  ${schema}

  unfortunately, YOU FAILED. it does not work for all the samples. Below are a sample of input, output and validation errors.
  Please fix ALL of the errors by returning a replacement function.

  REMEMBER YOUR OWN RULES: 

  If a field is empty, it should be null.
  ${REQUIREMENTS}

  Errors:

  ${validated
    .map(v => {
      return JSON.stringify(
        {
          input: v.original,
          output: v.data,
          validation_errors: v.schema.error.issues,
        },
        null,
        4
      );
    })
    .join("\n")}
`;

/* Sampling */

function random_sample(array, n) {
  const sample = [];
  for (let i = 0; i < n; i++) {
    const index = Math.floor(Math.random() * array.length);
    sample.push(array[index]);
  }
  return sample;
}

function random_sort(array) {
  return array.sort(() => Math.random() - 0.5);
}

// todo select the sample of pages using a similarity score picking the most dissimilar pages
function random_sample_context_constrained(
  array,
  token_budget,
  separator_tokens = 0
) {
  const sample = [];
  const random_array = random_sort(array);
  let total_tokens = 0;
  for (const item of random_array) {
    const tokens = countTokens(item) + separator_tokens;
    if (total_tokens + tokens > token_budget) {
      break;
    }
    sample.push(item);
    total_tokens += tokens;
  }
  return sample;
}

/* Code Gen */

async function gen_code(prompt_fn, array) {
  const prompt_tokens = countTokens(prompt_fn([]));
  const token_budget = MAX_TOKENS - prompt_tokens;
  const separator_tokens = countTokens(content_separator());

  const sample = random_sample_context_constrained(
    array,
    token_budget,
    separator_tokens
  );
  const code = await llm_completion(prompt_fn(sample));
  return code;
}

function extract(fn, original) {
  return original.map((r) => {
    try {
      return { data: fn(r), original: r, extraction_error: null };
    } catch (error) {
      const [_, line, col] = error.stack
        .split("\n")[1]
        .match(/<anonymous>:(\d+):(\d+)/);
      return {
        data: null,
        original: r,
        extraction_error: { message: error.message, line, col },
      };
    }
  });
}
function extract_error_summary(extracted) {
  const with_errors = extracted.filter((r) => r.extraction_error !== null);

  return with_errors.reduce((acc, result) => {
    const error = result.extraction_error;
    const key = `${error.message} at line ${error.line} col ${error.col}`;
    if (acc[key] === undefined) {
      acc[key] = { count: 0, examples: [] };
    }
    acc[key].count++;
    acc[key].examples.push(result.original);
    return acc;
  }, {});
}

async function generate() {
  console.log("loading original content");
  const { results: original } = JSON.parse(fs.readFileSync("index.json"));

  let isolation_code = "";
  if (fs.existsSync("isolate.mjs")) {
    console.log("loading isolation function");
    isolation_code = fs.readFileSync("isolate.mjs", "utf-8");
  } else {
    console.log("generating isolation function");
    isolation_code = await gen_code(gen_isolate_prompt, original);
    console.log(isolation_code);
    fs.writeFileSync("isolate.mjs", isolation_code);
  }

  console.log("isolating content");
  const isolation_fn = eval(`(${isolation_code})`);
  const content = original.map(isolation_fn);
  console.log("example: ", content[0]);

  let schema_code = "";
  if (fs.existsSync("schema.mjs")) {
    console.log("loading schema");
    schema_code = fs.readFileSync("schema.mjs", "utf-8");
  } else {
    console.log("generating schema");
    schema_code = await gen_code(gen_schema_prompt, content);
    console.log(schema_code);
    fs.writeFileSync("schema.mjs", schema_code);
  }
  const schema = eval(schema_code);

  let extract_code = "";
  if (fs.existsSync("extract.mjs")) {
    console.log("loading extract function");
    extract_code = fs.readFileSync("extract.mjs", "utf-8");
  } else {
    console.log("generating extract function");
    extract_code = await gen_code(gen_extract_prompt(schema_code), content);
    console.log(extract_code);
    fs.writeFileSync("extract.mjs", extract_code);
  }
  let extract_fn = eval(`(${extract_code})`);

  let validated = [];
  while (true) {
    console.log("testing extract function for runtime errors");
    let extracted = [];
    while (true) {
      extracted = extract(extract_fn, original);
      const unique_errors = extract_error_summary(extracted);
      console.log("extraction errors", Object.keys(unique_errors));
      if (Object.keys(unique_errors).length === 0) {
        break;
      } else {
        console.log("refining extract function");
        // todo fix to use context window constrained sample
        extract_code = await gen_code(
          refine_extract_prompt(extract_code, unique_errors),
          []
        );
        console.log(extract_code);
        fs.writeFileSync("extract.mjs", extract_code);
        extract_fn = eval(`(${extract_code})`);
      }
    }

    console.log("validating extraction function against schema");
    validated = extracted.map((e) => {
      return { ...e, schema: schema.safeParse(e.data) };
    });
    const invalid = validated.filter((v) => v.schema.success === false);
    if (invalid.length === 0) {
      break;
    } else {
      console.log("refining extract function");
      const errors = random_sample(
        validated.filter((v) => v.schema.success === false),
        2
      );
      console.log("PROMPT: ", refine_extract_prompt_two(extract_code, schema_code, errors)());
      // todo fix to use context window constrained sample
      extract_code = await gen_code(
        refine_extract_prompt_two(extract_code, schema_code, errors),
        []
      );
      console.log(extract_code);
      fs.writeFileSync("extract.mjs", extract_code);
      extract_fn = eval(`(${extract_code})`);
    }
  }
  fs.writeFileSync("validated.json", JSON.stringify(validated, null, 4));
}

generate();
