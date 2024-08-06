// Global
import { CORPUS_PATH } from "../files.mts";
import type { Analysis, TextCorpus } from "../interfaces.mts";

// Util
import { readTextFilesDir } from "../utility/io.mts";
import {
  averageStringLength,
  longestString,
  shortestString,
} from "../utility/util.mts";

// This Step
import { normHTMLExtract, normHTMLParse } from "./html.mts";
import { isolateCorpus } from "./isolate.mts";

const SAMPLE_LIMIT = 1000; // limiting the entire analysis

/**
 * Prints the statistics of the analysis to the console
 * @param stats
 */
export function printStats(stats: Analysis["stats"]) {
    console.log("Statistics:");
    console.log("Number of Samples:", stats.corpusSize);
    console.log("Prefix Length:", stats.prefixLength);
    console.log("Postfix Length:", stats.postFixLength);
    console.log("Average Sample Length:", stats.averageLength);
    console.log("Min Sample Length:", stats.minLength);
    console.log("Max Sample Length:", stats.maxLength);
  }
  

export function prepare(): {
  analysis: Analysis;
  corpus: TextCorpus;
} {
  let files = readTextFilesDir(CORPUS_PATH);

  if (files.length > SAMPLE_LIMIT) {
    console.log(
      "warning: corpus size exceeds the sample limit, truncating to",
      SAMPLE_LIMIT
    );
    files = files.slice(0, SAMPLE_LIMIT);
  }

  // keep only data
  const fileData = files.map((f) => f.data);

  // normalize whitespace
  const normedCorpus = fileData.map(normHTMLExtract);

  // isolate the corpus
  const { isolated, postfix, prefix } = isolateCorpus(normedCorpus);

  // normalize for parsing
  let corpus = isolated.map(normHTMLParse);

  // todo alberta specific
  corpus = corpus.map((sample) =>
    sample.replace(
      `<a href =https://www.lawsociety.ab.ca/public/lawyer-referral/report-request/ = ”subject text”= Message">`,
      `<a href="https://www.lawsociety.ab.ca/public/lawyer-referral/report-request/?subject=text&message=Message">`
    )
  );

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

  // print statistics
  printStats(analysis.stats);

  return { analysis, corpus };
}
