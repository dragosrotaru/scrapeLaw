// Global
import type { Analysis, PreparedCorpus } from "../interfaces.mts";
import { SAMPLE_LIMIT } from "../parameters.mts";

// Util
import { readTextFilesDir } from "../utility/io.mts";
import {
  averageStringLength,
  longestString,
  selectRandomSample,
  shortestString,
} from "../utility/util.mts";

// This Step
import { normHTMLExtract, normHTMLParse } from "./html.mts";
import { isolateCorpus } from "./isolate.mts";

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
  console.log("Reduction:", stats.reduction);
}

export function prepare(
  files: ReturnType<typeof readTextFilesDir>,
  sampleLimit: number = SAMPLE_LIMIT
): PreparedCorpus {

  console.log("Corpus Size: ", files.length);
  console.log("Sample Limit: ", sampleLimit);

  if (sampleLimit <= 0 && files.length > sampleLimit) {
    console.log(
      "warning: corpus size exceeds the sample limit, truncating to",
      SAMPLE_LIMIT
    );
    files = selectRandomSample(files, sampleLimit);
  }

  // keep only data
  let fileData = files.map((f) => f.data);

  // todo alberta specific
  fileData = fileData.map((sample) =>
    sample.replace(
      `<a href =https://www.lawsociety.ab.ca/public/lawyer-referral/report-request/ = ”subject text”= Message">`,
      `<a href="https://www.lawsociety.ab.ca/public/lawyer-referral/report-request/?subject=text&message=Message">`
    )
  );

  // normalize whitespace
  const normedCorpus = fileData.map(normHTMLExtract);

  // isolate the corpus
  const { isolated, postfix, prefix } = isolateCorpus(normedCorpus);

  // normalize for parsing
  const corpus = isolated.map(normHTMLParse);

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
      reduction: 1 - (averageLength / (averageLength + prefix.length + postfix.length)),
    },
    shortestSample,
    longestSample,
    prefix,
    postfix,
  };

  printStats(analysis.stats);

  return { analysis, corpus };
}
