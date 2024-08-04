import type { TextCorpus } from "./types.mts";
import { type Vector, vectorizeCorpus } from "./vector.mts";


/**
 * Returns the average length of strings in an array
 * @param strings
 * @returns
 */
export function averageStringLength(strings: TextCorpus): number {
  return (
    strings.reduce((acc, sample) => acc + sample.length, 0) / strings.length
  );
}

/**
 * Returns the shortest string in an array of strings
 * @param strings
 * @returns
 */
export function shortestString(strings: TextCorpus): string {
  return strings.reduce((shortest, current) =>
    current.length < shortest.length ? current : shortest
  );
}

/**
 * Returns the longest string in an array of strings
 * @param strings
 * @returns
 */
export function longestString(strings: TextCorpus): string {
  return strings.reduce((longest, current) =>
    current.length > longest.length ? current : longest
  );
}

/**
 * Generates a random sample from an array
 * @param max
 * @param count
 * @returns
 */
export function randomSample<T>(array: T[], count: number = 1): T[] {
  return Array.from(
    { length: count },
    () => array[Math.floor(Math.random() * array.length)]
  );
}

function sampleDistance(a: Vector, b: Vector): number {
  throw new Error("sample distance not implemented")
}


export function selectSample(textCorpus: TextCorpus, sampleSize: number): TextCorpus {
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
              const minDistance = Math.min(...samples.map(s => sampleDistance(s, vector)));
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
