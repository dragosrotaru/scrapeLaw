import { vectorizeCorpus } from "./parser.mts";

/**
 * Returns the average length of strings in an array
 * @param strings
 * @returns
 */
export function averageStringLength(strings: string[]): number {
  return (
    strings.reduce((acc, sample) => acc + sample.length, 0) / strings.length
  );
}

/**
 * Returns the shortest string in an array of strings
 * @param strings
 * @returns
 */
export function shortestString(strings: string[]): string {
  return strings.reduce((shortest, current) =>
    current.length < shortest.length ? current : shortest
  );
}

/**
 * Returns the longest string in an array of strings
 * @param strings
 * @returns
 */
export function longestString(strings: string[]): string {
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

function sampleDistance(a: number[], b: number[]): number {
  return 0;
}


export function selectSample(corpus: string[], sampleSize: number) {
  const { structuralDictionary, contentDictionary, vectorized } = vectorizeCorpus(corpus);

  console.log(structuralDictionary);
  console.log(contentDictionary);

  if (sampleSize > corpus.length) {
    throw new Error("Sample size must be less than the corpus size");
  }

  const samples = [vectorized[0]];
  const samplesHTML = [corpus[0]];
  while (samples.length < sampleSize) {
      let maxMinDistance = -1;
      let farthestSample: number[] | null = null
      let farthestSampleHTML: string | null = null
      for (let index = 0; index < vectorized.length; index++) {
        const vector = vectorized[index];
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
