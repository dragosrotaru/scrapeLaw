// Global
import type { TextCorpus } from "../interfaces.mts";

// Utility
import type { Vector } from "../utility/types.mts";

// This Step
import { vectorDistance, vectorizeCorpus } from "./vector.mts";

/**
 * Returns a sample of the text corpus based on a vector distance metric
 * @param textCorpus 
 * @param sampleSize 
 * @returns 
 */
export function selectHTMLSample(textCorpus: TextCorpus, sampleSize: number): TextCorpus {
  const corpus = vectorizeCorpus(textCorpus);

  if (sampleSize > textCorpus.length) {
    throw new Error("Sample size must be less than the corpus size");
  }

  const samples = [corpus.vectorized[0]];
  const samplesHTML = [textCorpus[0]];
  while (samples.length < sampleSize) {
      let maxMinDistance = -1;
      let farthestSample: Vector | null = null
      let farthestSampleHTML: string | null = null
      for (let index = 0; index < corpus.vectorized.length; index++) {
        const vector = corpus.vectorized[index];
        const html = corpus[index];
          if (!samples.includes(vector)) {
              const minDistance = Math.min(...samples.map(s => vectorDistance(s, vector)));
              if (minDistance > maxMinDistance) {
                  maxMinDistance = minDistance;
                  farthestSample = vector;
                  farthestSampleHTML = html;
              }
          }
      }
      if (farthestSample) samples.push(farthestSample);
      if (farthestSampleHTML) samplesHTML.push(farthestSampleHTML);
  }
  return samplesHTML
}
