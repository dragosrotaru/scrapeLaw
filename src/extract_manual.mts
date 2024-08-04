import {
  ANALYSIS_FILE,
  CORPUS_PATH,
  DATASET_FILE,
  REPRODUCTION_FILE,
} from "./files.mts";
import { askQuestion, loadCorpusFiles, readJSON, writeJSON } from "./io.mts";
import { isolateCorpus } from "./isolate.mts";
import { printSample, printStats } from "./print.tsx";
import {
  averageStringLength,
  longestString,
  selectSample,
  shortestString,
} from "./sample.mts";
import {
  type NullableString,
  type Analysis,
  type Data,
  TextCorpus,
} from "./types.mts";
import { normHTMLExtract } from "./parser.mts";

const SAMPLE_LIMIT = 1000; // limiting the entire analysis
const SAMPLE_COUNT = 10; // for showing to the user

type Bounds = string[];

/**
 * Extracts a dynamic string between two static boundaries and returns the remaining string along with it
 * @param str
 * @param staticSub
 * @returns
 */
function extractDynamic(
  str: string,
  postfixBounds: Bounds,
  prefixBounds?: Bounds,
) {
  let remaining = str;
  let data: NullableString = null;
  let prefix: NullableString = null;
  let postfix: NullableString = null;

  // If no prefix bounds are provided, we assume the prefix is an empty string
  // indexOf will return 0 if the prefix is an empty string
  if (!prefixBounds) prefixBounds = [""];

  for (const pre of prefixBounds) {
    for (const post of postfixBounds) {
      const preIndex = str.indexOf(pre);
      const postIndex = str.indexOf(post, preIndex + pre.length);
      if (preIndex > -1 && postIndex > preIndex) {
        const possibleData = str.substring(preIndex + pre.length, postIndex);
        if (possibleData.length > 0) {
          data = possibleData;
        }
        remaining = str.substring(postIndex); // returns remanining including the postfix
        prefix = pre;
        postfix = post;
        break;
      }
    }
  }
  return { data, remaining, prefix, postfix };
}

/* Analysis */

/**
 * Initializes the analysis object with statistics
 * @param originalCorpus
 * @returns
 */
export function initAnalysis(originalCorpus: TextCorpus): {
  analysis: Analysis;
  corpus: TextCorpus;
} {
  if (originalCorpus.length > SAMPLE_LIMIT) {
    console.log(
      "warning: corpus size exceeds the sample limit, truncating to",
      SAMPLE_LIMIT
    );
    originalCorpus = originalCorpus.slice(0, SAMPLE_LIMIT);
  }
  // normalize the corpus by removing extra whitespace
  const normedCorpus = originalCorpus.map(normHTMLExtract);

  // isolate the corpus
  const { corpus, postfix, prefix } = isolateCorpus(normedCorpus);

  // find the longest remaining string
  const longestSample = longestString(corpus);
  const shortestSample = shortestString(corpus);
  const averageLength = averageStringLength(corpus);

  // initialize the analysis
  const analysis: Analysis = {
    stats: {
      corpusSize: corpus.length,
      averageLength,
      minLength: shortestSample.length,
      maxLength: longestSample.length,
      prefixLength: prefix.length,
      postFixLength: postfix.length,
    },
    shortestSample,
    longestSample,
    prefix,
    postfix,
    fields: [],
  };

  return { analysis, corpus };
}

/**
 * Interactively analyze a corpus and extract fields
 */
async function interactiveAnalysis() {
  try {
    // load the corpus
    // const originalCorpus = readJSON(CORPUS_FILE).results as TextCorpus;
    let originalCorpus = loadCorpusFiles(CORPUS_PATH).map((file) => file.data);

    // todo alberta specific
    originalCorpus = originalCorpus.map((sample) =>
      sample.replace(
        `<a href =https://www.lawsociety.ab.ca/public/lawyer-referral/report-request/ = ”subject text”= Message">`,
        `<a href="https://www.lawsociety.ab.ca/public/lawyer-referral/report-request/?subject=text&message=Message">`
      )
    );

    // initialize the analysis
    const { analysis, corpus: isolatedCorpus } = initAnalysis(originalCorpus);
    let corpus = isolatedCorpus;

    // print statistics
    printStats(analysis.stats);

    // continuation flags
    let longestSample = longestString(corpus);
    let shortestSample = shortestString(corpus);
    let askContinue = false;

    while (longestSample.length > 0) {
      longestSample = longestString(corpus);
      shortestSample = shortestString(corpus);
      console.log("longest remaining sample:", longestSample.length);
      console.log("shortest remaining sample:", shortestSample.length);

      // check if the user wants to continue
      if (askContinue) {
        askContinue = true;
        let continueAnalysis = await askQuestion("continue analysis? (y/n) ");
        if (continueAnalysis !== "y") break;
      }

      // print random samples
      console.log(`here are ${SAMPLE_COUNT} selected samples:`);
      const selectedSamples = selectSample(corpus, SAMPLE_COUNT);
      console.log("samples selected: ", selectedSamples.length);
      for (const sample of selectedSamples) printSample(sample);

      // ask user for the field name
      let fieldName = "";
      while (fieldName === "") {
        fieldName = await askQuestion(
          "please provide the desired field name: "
        );
      }

      // ask user for field prefixes
      let fieldPrefixes: Bounds | null = null;
      while (fieldPrefixes === null) {
        try {
          const prefix = await askQuestion(
            "please provide the field prefix(es) if any: "
          );
          if (prefix === "") {
            fieldPrefixes = [""];
            break;
          }
          fieldPrefixes = JSON.parse(prefix) as Bounds;
        } catch (error) {
          console.log(
            "please enter a valid prefix array in JSON format or leave blank"
          );
          continue;
        }
        if (
          !Array.isArray(fieldPrefixes) ||
          !fieldPrefixes.every((b) => typeof b === "string")
        ) {
          console.log(
            "error: please enter a valid prefix array in JSON format or leave blank"
          );
          continue;
        }
      }

      // ask user for field postfixes
      let fieldPostfixes: Bounds | null = null;
      while (fieldPostfixes === null) {
        try {
          const boundary = await askQuestion(
            "please provide the field postfix: "
          );
          fieldPostfixes = JSON.parse(boundary) as Bounds;
        } catch (error) {
          console.log(
            "error: please enter a valid postfix array in JSON format"
          );
          continue;
        }
        if (
          !Array.isArray(fieldPostfixes) ||
          !fieldPostfixes.every((b) => typeof b === "string") ||
          fieldPostfixes.length === 0
        ) {
          console.log(
            "error: please enter a valid postfix array in JSON format"
          );
          continue;
        }
      }

      // test the field
      selectedSamples.forEach((sample) => {
        const { data, prefix, postfix } = extractDynamic(
          sample,
          fieldPostfixes,
          fieldPrefixes
        );
        console.log("data:", data);
        if (!data) {
          console.log("exception: data not found");
          console.log(prefix, postfix);
          printSample(sample);
        }
      });

      // ask user if the data is as expected
      const isDataCorrect = await askQuestion(
        "is the data as expected? (y/n) "
      );
      if (isDataCorrect !== "y") {
        console.log("exception: please adjust the field boundaries");
        askContinue = false;
        continue;
      }

      // attempt to extract the field
      const fieldData: Data[] = [];
      const notFound: string[] = [];

      const newCorpus = corpus.map((sample) => {
        const { data, remaining, prefix, postfix } = extractDynamic(
          sample,
          fieldPostfixes,
          fieldPrefixes
        );
        if (!data) notFound.push(sample);
        fieldData.push({ data, prefix, postfix });
        return remaining;
      });

      // identify nullable fields
      let fieldNullable = false;
      if (notFound.length > 0) {
        // print samples that were not found
        console.log(
          "no data found for:",
          notFound.length,
          "out of",
          corpus.length
        );
        console.log(`here are ${SAMPLE_COUNT} counter samples:`);
        const notFoundSamples = selectSample(notFound, SAMPLE_COUNT);
        for (const notFound of notFoundSamples) printSample(notFound);

        const isNullable = await askQuestion("is this field nullable? (y/n) ");
        if (isNullable === "y") fieldNullable = true;
        else {
          console.log("exception: please retry the field extraction");
          askContinue = false;
          continue;
        }
      }

      // update the corpus and analysis
      corpus = newCorpus;
      analysis.fields.push({
        fieldName,
        nullable: fieldNullable,
        prefixes: fieldPrefixes,
        postfixes: fieldPostfixes,
        data: fieldData,
      });
      writeJSON(ANALYSIS_FILE, analysis);
    }

    console.log("Analysis Complete!");
    writeJSON(ANALYSIS_FILE, analysis);
  } catch (error) {
    console.error("Unexpected Error:", error);
  }
}

/**
 * Reproduces an analysis by re-extracting field data from a corpus
 */
export function reproduceAnalysis() {
  try {
    const originalAnalysis = readJSON(ANALYSIS_FILE) as Analysis;

    // load the corpus
    // const originalCorpus = readJSON(CORPUS_FILE).results as TextCorpus;
    const originalCorpus = loadCorpusFiles(CORPUS_PATH).map(
      (file) => file.data
    );

    // initialize the analysis
    const { analysis: reproduction, corpus } = initAnalysis(originalCorpus);

    // print statistics
    printStats(reproduction.stats);

    for (const field of originalAnalysis.fields) {
      const { fieldName, nullable, prefixes, postfixes } = field;
      console.log("field name:", fieldName);
      console.log("nullable:", nullable);
      console.log("prefixes:", prefixes);
      console.log("postfixes:", postfixes);
      console.log("extracting data");

      // extract the data
      const data: Data[] = corpus.map((sample) => {
        const { data, prefix, postfix } = extractDynamic(
          sample,
          field.postfixes,
          field.prefixes
        );
        return { data, prefix, postfix };
      });

      // aggregate the data
      reproduction.fields.push({
        fieldName,
        nullable,
        prefixes,
        postfixes,
        data,
      });
    }
    writeJSON(REPRODUCTION_FILE, reproduction);
    console.log("Reproduction Complete!");
  } catch (error) {
    console.error("Unexpected Error:", error);
  }
}

/**
 * Produces a dataset from an analysis
 */
export function produceDataset() {
  try {
    const analysis = readJSON(ANALYSIS_FILE) as Analysis;

    const dataset: Record<string, NullableString>[] = [];
    for (const field of analysis.fields) {
      const { fieldName, data } = field;
      for (let i = 0; i < data.length; i++) {
        const row = dataset[i] || {};
        row[fieldName] = data[i].data;
        dataset[i] = row;
      }
    }

    writeJSON(DATASET_FILE, dataset);
    console.log("Dataset Produced!");
  } catch (error) {
    console.error("Unexpected Error:", error);
  }
}
