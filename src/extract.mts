import { ANALYSIS_FILE, CORPUS_FILE, CORPUS_PATH, DATASET_FILE, REPRODUCTION_FILE } from "./files.mts";
import { askQuestion, loadCorpusFiles, readJSON, writeJSON } from "./io.mts";
import { isolateCorpus } from "./isolate.mts";
import { compressZeroComponents, generateFrequencyMaps, generateFrequencyVector, normHTMLExtract, vectorizeCorpus, vectorToText, zeroOutFrequentTokens } from "./parser.mts";
import { averageStringLength, longestString, randomSample, selectSample, shortestString } from "./sample.mts";
import { type NullableString, type Analysis, type Data } from "./types.mts";

/**
 * Extracts a dynamic string between two static boundaries and returns the remaining string along with it
 * @param str
 * @param staticSub
 * @returns
 */
function extractDynamic(
  str: string,
  postfixBounds: string[],
  prefixBounds?: string[]
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

/* Printing */

/**
 * Pretty Prints a sample to the console
 * @param sample
 */
function printSample(sample: string) {
  const PRINT_LENGTH = 256;
  console.log(JSON.stringify(sample.slice(0, PRINT_LENGTH)));
  console.log(
    `(first ${PRINT_LENGTH} characters shown) \n`
  );
}

/**
 * Prints the statistics of the analysis to the console
 * @param stats
 */
function printStats(stats: Analysis["stats"]) {
  console.log("Statistics:");
  console.log("Number of Samples:", stats.corpusSize);
  console.log("Prefix Length:", stats.prefixLength);
  console.log("Postfix Length:", stats.postFixLength);
  console.log("Average Sample Length:", stats.averageLength);
  console.log("Min Sample Length:", stats.minLength);
  console.log("Max Sample Length:", stats.maxLength);
}

/* Analysis */

/**
 * Initializes the analysis object with statistics
 * @param originalCorpus
 * @returns
 */
function initAnalysis(
  originalCorpus: string[],
): { analysis: Analysis, corpus: string[] } {
  // limit the number of samples
  const SAMPLE_LIMIT = 1000;
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

  return { analysis, corpus};
}

/**
 * Interactively analyze a corpus and extract fields
 */
async function interactiveAnalysis() {
  // number of samples to show
  const SAMPLE_COUNT = 10;

  try {
    // load the corpus
    // const originalCorpus = readJSON(CORPUS_FILE).results as string[];
    let originalCorpus = loadCorpusFiles(CORPUS_PATH).map((file) => file.data);

    // todo alberta specific
    originalCorpus = originalCorpus.map((sample) => sample.replace(`<a href =https://www.lawsociety.ab.ca/public/lawyer-referral/report-request/ = ”subject text”= Message">`, `<a href="https://www.lawsociety.ab.ca/public/lawyer-referral/report-request/?subject=text&message=Message">`));

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
      let fieldPrefixes: string[] | null = null;
      while (fieldPrefixes === null) {
        try {
          const prefix = await askQuestion(
            "please provide the field prefix(es) if any: "
          );
          if (prefix === "") {
            fieldPrefixes = [""];
            break;
          }
          fieldPrefixes = JSON.parse(prefix) as string[];
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
      let fieldPostfixes: string[] | null = null;
      while (fieldPostfixes === null) {
        try {
          const boundary = await askQuestion(
            "please provide the field postfix: "
          );
          fieldPostfixes = JSON.parse(boundary) as string[];
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
 * Detects outliers in a corpus by analyzing the frequency of the tokens, not taking into account position
 * Returns the outliers and the tokens that are not in the outliers
 * @param result 
 * @param freqMaps 
 * @returns 
 */
function outlierDetection(result: ReturnType<typeof vectorizeCorpus>, freqMaps: ReturnType<typeof generateFrequencyMaps>) {
  const SAMPLES = 10;
  const INCREMENT = 0.001;
  const MIN_PARAM = 0.95;
  
  let samples = randomSample(result.vectorized, SAMPLES);
  let stablePoints: number[] = [];

  for (const sample of samples) {
    // get the lengths of each sample if we zero out the frequent tokens by a different percentage
    const lengths: number[][] = [];
    let param = 1;
    while (param > MIN_PARAM) {
      const vec = zeroOutFrequentTokens(sample, result, freqMaps, param).filter(a => a !== 0);
      const len = vectorToText(vec, result).length;
      lengths.push([len, param]);
      param = param - INCREMENT;
    }

    // find the point where the length becomes stable
    for (let i = 0; i < lengths.length; i++) {
      if (lengths[i][0] === lengths[i + 1][0] && lengths[i][0] === lengths[i + 2][0]) {
        stablePoints.push(lengths[i][1]);
        break;
      }
    }
  }

  console.log("stable points", stablePoints);

  if (stablePoints.length !== samples.length) {
    throw new Error("Stable points not found for all random samples");
  }

  // find the average stable point
  const meanStablePoint = stablePoints.reduce((a, b) => a + b) / stablePoints.length;
  console.log("mean stable point", meanStablePoint);

  // exclude samples which had a high stable point
  samples = samples.filter((_, i) => stablePoints[i] <= meanStablePoint * 1.01);

  // find the unique tokens which are not excluded past the stable point, but are excluded before the stable point
  const diffSet = new Set<number>();
  for (const sample of samples) {
    const stableVec = zeroOutFrequentTokens(sample, result, freqMaps, meanStablePoint);
    const unstableVec = zeroOutFrequentTokens(sample, result, freqMaps, 1);
    const diff = unstableVec.filter((v) => !stableVec.includes(v));
    diff.map((v) => diffSet.add(v));
  }

  console.log("Diff Set:", diffSet.size);

  // find the outliers by checking which samples do not contain the diff tokens
  const outliers: [number[], number][] = [];
  for (const sample of result.vectorized) {
    const diffs: number[] = [];
    diffSet.forEach((diff) => {
      if (!sample.includes(diff)) {
        diffs.push(diff);
      }
    });
    if (diffs.length > 0) {
      outliers.push([sample, diffs.length]);
    }
  }

  // sort the outliers by the number of diff tokens they lack
  outliers.sort((a, b) => a[1] - b[1]);

  const outlierPercentage = outliers.length / result.vectorized.length;
  const expectedOutlierPercentage = (1 - meanStablePoint);

  console.log("Outliers Found:", outliers.length, outlierPercentage);
  console.log("Expected Outliers:", Math.floor(result.vectorized.length * expectedOutlierPercentage), expectedOutlierPercentage);
  if (outlierPercentage - expectedOutlierPercentage > 0.005) {
    console.log("Warning: Outlier Percentage is outside of expected range");
  }


  // Print an outlier Sample
  const sample = randomSample(outliers, 1)[0][0];
  if (sample) {
    const zeroedOut = zeroOutFrequentTokens(sample, result, freqMaps, meanStablePoint);
    const compressed = compressZeroComponents(zeroedOut);
    const text = vectorToText(compressed, result);
    console.log("Outlier Sample:", text.map(t => t === null ? "STATIC" : t).join(" "));
  }

  return { outliers, diffSet, meanStablePoint };
}

/**
 * Interactively analyze a corpus and extract fields
 */
async function autoAnalysis() {
  try {
    // load the corpus
    // const originalCorpus = readJSON(CORPUS_FILE).results as string[];
    let originalCorpus = loadCorpusFiles(CORPUS_PATH).map((file) => file.data);

    // todo alberta specific
    originalCorpus = originalCorpus.map((sample) => sample.replace(`<a href =https://www.lawsociety.ab.ca/public/lawyer-referral/report-request/ = ”subject text”= Message">`, `<a href="https://www.lawsociety.ab.ca/public/lawyer-referral/report-request/?subject=text&message=Message">`));

    // initialize the analysis
    const { analysis, corpus: isolatedCorpus } = initAnalysis(originalCorpus);
    const corpus = isolatedCorpus;

    // print statistics
    printStats(analysis.stats);

    // generate vectorized corpus with maps
    console.log("Vectorizing Corpus");
    const result = vectorizeCorpus(corpus);
    console.log(result.contentDictionary);
    console.log(result.structuralDictionary);
    const freqMaps = generateFrequencyMaps(result);

    // outlier detection
    console.log("Outlier Detection");
    const outlier = outlierDetection(result, freqMaps);
    
    // print a sample
    const sample = randomSample(result.vectorized, 1)[0];
    const zeroedOut = zeroOutFrequentTokens(sample, result, freqMaps, outlier.meanStablePoint);
    const compressed = compressZeroComponents(zeroedOut);
    console.log(compressed);
    const text = vectorToText(compressed, result);
    console.log("Sample:", text.map(t => t === null ? "STATIC" : t).join(" "));
    const sampleFreq = generateFrequencyVector(sample, result, freqMaps);
    console.log("Sample Frequency:", sampleFreq);

  } catch (error) {
    console.error("Unexpected Error:", error);
  }
}

/**
 * Reproduces an analysis by re-extracting field data from a corpus
 */
function reproduceAnalysis() {
  try {
    const originalAnalysis = readJSON(ANALYSIS_FILE) as Analysis;

    // load the corpus
    // const originalCorpus = readJSON(CORPUS_FILE).results as string[];
    const originalCorpus = loadCorpusFiles(CORPUS_PATH).map((file) => file.data);

    // initialize the analysis
    const { analysis: reproduction, corpus } = initAnalysis(originalCorpus);
    
    // print statistics
    printStats(reproduction.stats);

    for (const field of originalAnalysis.fields) {
      const { fieldName, nullable, prefixes, postfixes } = field;
      console.log("field name:", fieldName);
      console.log("nullable:", nullable);
      console.log("prefixes:", prefixes);
      console.log("postfixes:",postfixes);
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
function produceDataset() {
  try {
    const analysis = (readJSON(ANALYSIS_FILE)) as Analysis;

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

autoAnalysis();