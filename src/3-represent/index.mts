// Global
import type { Output, PreparedCorpus, Representation } from "../interfaces.mts";

// This Step
import { outlierDetection } from "./outlier.mts";
import {
  applyStaticThreshold,
  compressStaticComponents,
  dedupSequences,
  generateFrequencyMaps,
  generateFrequencyVector,
  isStructuralToken,
  vectorizeCorpus,
} from "./vector.mts";

export function represent(preparation: PreparedCorpus): Representation {
  // prior step
  const { corpus } = preparation;

  // generate vectorized corpus with maps
  const [maps, vectorized ]= vectorizeCorpus(corpus);
  const freq = generateFrequencyMaps(vectorized, maps);

  // outlier detection
  const outlier = outlierDetection(vectorized, maps, freq);

  // pick a sample
  const output: Output[] = [];
  for (const vector of vectorized) {
    // apply static threshold
    const zeroedOut = applyStaticThreshold(
      vector,
      maps,
      freq,
      outlier.meanStablePoint
    );

    // compress static components
    const compressed = compressStaticComponents(zeroedOut);

    // filter out strutural tokens
    const content = compressed.filter((v) => !isStructuralToken(v));

    // deduplicate sequences
    const deduplicated = dedupSequences(content);

    // frequency vector
    const frequency = generateFrequencyVector(deduplicated, maps, freq);

    output.push([deduplicated, frequency]);
  }

  return { preparation, vectorized, maps, freq, outlier, output };
}