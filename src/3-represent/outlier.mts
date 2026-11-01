// Global
import type { CorpusFrequency, CorpusMaps, Outlier, VectorCorpus } from "../interfaces.mts";
import { OUTLIER_DECREMENT, OUTLIER_ERROR_MARGIN, OUTLIER_MAX_THRESHOLD, OUTLIER_MIN_THRESHOLD, OUTLIER_SAMPLES } from "../parameters.mts";

// Utility
import type { Vector } from "../utility/types.mts";
import { selectRandomSample } from "../utility/util.mts";

// This Step
import {
  applyStaticThreshold,
  isStaticToken,
} from "./vector.mts"; 

/**
 * Detects outliers in a corpus by analyzing the frequency of the tokens, not taking into account position
 * Returns the outliers and the tokens that are not in the outliers
 * @param corpus
 * @param freqMaps
 * @returns
 */
export function outlierDetection(
    corpus: VectorCorpus,
    maps: CorpusMaps,
    freq: CorpusFrequency
  ): Outlier {

    // pick a random sample
    let samples = selectRandomSample(corpus, OUTLIER_SAMPLES);
    let stablePoints: number[] = [];
  
    for (const sample of samples) {
  
      const lengths: [number, number][] = [];
      let threshold = OUTLIER_MAX_THRESHOLD;
      
      while (threshold > OUTLIER_MIN_THRESHOLD) {
        // apply static threshold and filter out static tokens
        const vector = applyStaticThreshold(sample, maps, freq, threshold).filter((t) => !isStaticToken(t));
        
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
        threshold = threshold - OUTLIER_DECREMENT;
      }
    }
  
    console.log("Stable Points:", stablePoints);
  
    if (stablePoints.length !== samples.length) {
      throw new Error("Stable points not found for all random samples");
    }
  
    // find the average stable point
    const meanStablePoint =
      stablePoints.reduce((a, b) => a + b) / stablePoints.length;
    console.log("Mean Stable Point:", meanStablePoint);
  
    // exclude samples which had a high stable point, add a little margin for real number math
    samples = samples.filter((_, i) => stablePoints[i] <= meanStablePoint * 1.01);
  
    // find the unique tokens which are not excluded past the stable point, but are excluded before the stable point
    const diffSet = new Set<number>();
    for (const sample of samples) {
      const stableVec = applyStaticThreshold(
        sample,
        maps,
        freq,
        meanStablePoint
      );
      const unstableVec = applyStaticThreshold(sample, maps, freq, OUTLIER_MAX_THRESHOLD);
      const diff = unstableVec.filter((v) => !stableVec.includes(v));
      diff.map((v) => diffSet.add(v));
    }
  
    console.log("Diff Set:", diffSet.size);
  
    // find the outliers by checking which samples do not contain the diff tokens
    const outliers: [Vector, number][] = [];
    for (const sample of corpus) {
      const diffs: Vector = [];
      diffSet.forEach((diff) => {
        if (!sample.includes(diff)) diffs.push(diff);
      });
      if (diffs.length > 0) outliers.push([sample, diffs.length]);
    }
  
    // sort the outliers by the number of diff tokens they lack
    outliers.sort((a, b) => a[1] - b[1]);
  
    const outlierPercentage = outliers.length / corpus.length;
    const expectedOutlierPercentage = 1 - meanStablePoint;
  
    console.log("Outliers Found:", outliers.length, outlierPercentage);
  
    console.log(
      "Expected Outliers:",
      Math.floor(corpus.length * expectedOutlierPercentage),
      expectedOutlierPercentage
    );
  
    if (outlierPercentage - expectedOutlierPercentage > OUTLIER_ERROR_MARGIN) {
      console.log("Warning: Outlier Percentage is outside of expected range");
    }
  
    return { outliers, diffSet, meanStablePoint };
  }