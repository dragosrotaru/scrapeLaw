import { CORPUS_PATH } from "./files.mts";
import { loadCorpusFiles } from "./io.mts";
import {
  compressStaticComponents,
  generateFrequencyMaps,
  generateFrequencyVector,
  vectorizeCorpus,
  vectorToText,
  applyStaticThreshold,
  isStructuralToken,
  dedupSequences,
  isStaticToken,
  type CorpusFrequency,
  type VectorizedCorpus,
  type Vector,
} from "./vector.mts";
import { printColoredStrings, printStats } from "./print.tsx";
import { randomSample } from "./sample.mts";
import { initAnalysis } from "./extract_manual.mts";
 
/**
 * Detects outliers in a corpus by analyzing the frequency of the tokens, not taking into account position
 * Returns the outliers and the tokens that are not in the outliers
 * @param corpus
 * @param freqMaps
 * @returns
 */
function outlierDetection(
  corpus: VectorizedCorpus,
  freq: CorpusFrequency
) {
  const SAMPLES = 20;
  const DEINCREMENT = 0.001;
  const MAX_TRESHOLD = 1;
  const MIN_TRESHOLD = 0.95;
  const ERROR_MARGIN = 0.005;

  // pick a random sample
  let samples = randomSample(corpus.vectorized, SAMPLES);
  let stablePoints: number[] = [];

  for (const sample of samples) {

    const lengths: [number, number][] = [];
    let threshold = MAX_TRESHOLD;
    
    while (threshold > MIN_TRESHOLD) {
      // apply static threshold and filter out static tokens
      const vector = applyStaticThreshold(sample, corpus, freq, threshold).filter((t) => !isStaticToken(t));
      
      // get the length and add it to the array
      lengths.push([vector.length, threshold]);

      // check if we've reached a stable point, i.e. last 3 lengths have been the same
      if (lengths.length >= 3) {
        const current = lengths[lengths.length - 1];
        const last = lengths[lengths.length - 2];
        const secondLast = lengths[lengths.length - 3];
        if (current[0] === last[0] && current[0] === secondLast[0]) {
          stablePoints.push(current[1]);
          break;
        }
      }

      // decrement the threshold
      threshold = threshold - DEINCREMENT;
    }
  }

  console.log("stable points", stablePoints);

  if (stablePoints.length !== samples.length) {
    throw new Error("Stable points not found for all random samples");
  }

  // find the average stable point
  const meanStablePoint =
    stablePoints.reduce((a, b) => a + b) / stablePoints.length;
  console.log("mean stable point", meanStablePoint);

  // exclude samples which had a high stable point, add a little margin for real number math
  samples = samples.filter((_, i) => stablePoints[i] <= meanStablePoint * 1.01);

  // find the unique tokens which are not excluded past the stable point, but are excluded before the stable point
  const diffSet = new Set<number>();
  for (const sample of samples) {
    const stableVec = applyStaticThreshold(
      sample,
      corpus,
      freq,
      meanStablePoint
    );
    const unstableVec = applyStaticThreshold(sample, corpus, freq, MAX_TRESHOLD);
    const diff = unstableVec.filter((v) => !stableVec.includes(v));
    diff.map((v) => diffSet.add(v));
  }

  console.log("Diff Set:", diffSet.size);

  // find the outliers by checking which samples do not contain the diff tokens
  const outliers: [Vector, number][] = [];
  for (const sample of corpus.vectorized) {
    const diffs: Vector = [];
    diffSet.forEach((diff) => {
      if (!sample.includes(diff)) diffs.push(diff);
    });
    if (diffs.length > 0) outliers.push([sample, diffs.length]);
  }

  // sort the outliers by the number of diff tokens they lack
  outliers.sort((a, b) => a[1] - b[1]);

  const outlierPercentage = outliers.length / corpus.vectorized.length;
  const expectedOutlierPercentage = 1 - meanStablePoint;

  console.log("Outliers Found:", outliers.length, outlierPercentage);

  console.log(
    "Expected Outliers:",
    Math.floor(corpus.vectorized.length * expectedOutlierPercentage),
    expectedOutlierPercentage
  );

  if (outlierPercentage - expectedOutlierPercentage > ERROR_MARGIN) {
    console.log("Warning: Outlier Percentage is outside of expected range");
  }

  return { outliers, diffSet, meanStablePoint };
}

/**
 * analyze a corpus and extract fields
 */
async function vectorAnalysis() {
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
    const { analysis, corpus: textCorpus } = initAnalysis(originalCorpus);

    // print statistics
    printStats(analysis.stats);

    // generate vectorized corpus with maps
    console.log("Vectorizing Corpus \n");
    const corpus = vectorizeCorpus(textCorpus);
    const freq = generateFrequencyMaps(corpus);

    // outlier detection
    console.log("\n Outlier Detection \n");
    const outlier = outlierDetection(corpus, freq);

    // pick a sample
    const sample = randomSample(corpus.vectorized, 1)[0];

    // apply static threshold
    const zeroedOut = applyStaticThreshold(
      sample,
      corpus,
      freq,
      outlier.meanStablePoint
    );

    // compress static components
    const compressed = compressStaticComponents(zeroedOut);

    // filter out strutural tokens
    const filtered = compressed.filter((v) => !isStructuralToken(v));

    // deduplicate sequences
    const deduplicated = dedupSequences(filtered);

    // print sample
    const sampleTokens = vectorToText(deduplicated, corpus);
    const sampleFreq = generateFrequencyVector(deduplicated, corpus, freq);
    printColoredStrings(sampleTokens, sampleFreq);
  } catch (error) {
    console.error("Unexpected Error:", error);
  }
}

vectorAnalysis();
