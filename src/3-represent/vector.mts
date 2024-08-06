// Utility
import type { Vector } from "../utility/types.mts";

// This Step
import { isLexedTag, parser } from "./parser.mts";

export const STATIC_TOKEN = "STATIC";
export const STATIC_TOKEN_INDEX = 0;
export const STATIC_TOKEN_FREQUENCY = 1;

export type TokenMap = Map<string, number>;

export type VectorizedCorpus = {
  structuralMap: TokenMap;
  contentMap: TokenMap;
  vectorized: Vector[];
};

export type CorpusFrequency = {
  structural: TokenMap;
  content: TokenMap;
};

/**
 * Checks if a token is a static token
 * @param tokenIndex
 * @returns
 */
export function isStaticToken(tokenIndex: number): boolean {
  return tokenIndex === STATIC_TOKEN_INDEX;
}

/**
 * Checks if a token is a structural token
 * @param tokenIndex
 * @returns
 */
export function isStructuralToken(tokenIndex: number): boolean {
  return tokenIndex % 2 === 1;
}


export function vectorDistance(a: Vector, b: Vector): number {
  throw new Error("sample distance not implemented")
}

/**
 * Takes a corpus of html strings and returns a custom vector representation
 * of the corpus, along with dictionaries for the structural and content
 * tokens, for the purpose of selecting a sample of the corpus in a web scraping
 * context
 * @param corpus
 * @returns
 */
export function vectorizeCorpus(corpus: string[]): VectorizedCorpus {
  const structuralMap: TokenMap = new Map();
  const contentMap: TokenMap = new Map();
  const vectorized: Vector[] = [];

  let structuralIndex = 1;
  let contentIndex = 2;

  for (const html of corpus) {
    const tokens = parser(html);
    const sampleVector: Vector = [];
    for (const token of tokens) {
      if (isLexedTag(token)) {
        if (!structuralMap.has(token)) {
          structuralMap.set(token, structuralIndex);
          sampleVector.push(structuralIndex);
          structuralIndex = structuralIndex + 2;
        } else {
          sampleVector.push(structuralMap.get(token)!);
        }
      } else {
        if (!contentMap.has(token)) {
          contentMap.set(token, contentIndex);
          sampleVector.push(contentIndex);
          contentIndex = contentIndex + 2;
        } else {
          sampleVector.push(contentMap.get(token)!);
        }
      }
    }
    vectorized.push(sampleVector);
  }

  return { structuralMap, contentMap: contentMap, vectorized };
}

/* Vector to Textual Token */

/**
 * Helper function to get a key by its value in a Map
 * @param map
 * @param value
 * @returns
 */
function componentToText(
  { contentMap, structuralMap }: VectorizedCorpus,
  value: number
): string {
  if (isStaticToken(value)) return STATIC_TOKEN;
  const map = isStructuralToken(value) ? structuralMap : contentMap;
  for (const [key, val] of map.entries()) if (val === value) return key;
  throw new Error("Key not found");
}

/**
 * Converts a vector to its text representation
 * @param vector A vector from the corpus
 * @param result VectorizedCorpus
 * @returns A string representation of the vector
 */
export function vectorToText(
  vector: Vector,
  corpus: VectorizedCorpus
): string[] {
  return vector.map((tokenIndex) => componentToText(corpus, tokenIndex));
}

/* Frequency Related */

/**
 * Generates frequency maps for structural and content tokens based on the vectorized corpus
 * @param result type CorpusFrequency
 * @returns Object containing frequency maps for structural and content tokens
 */
export function generateFrequencyMaps(
  corpus: VectorizedCorpus
): CorpusFrequency {
  const { vectorized, structuralMap, contentMap } = corpus;
  const structuralFrequency: TokenMap = new Map();
  const contentFrequency: TokenMap = new Map();

  // Count tokens for each item in the corpus
  for (const sampleVector of vectorized) {
    const uniqueStructuralTokens = new Set<string>();
    const uniqueContentTokens = new Set<string>();

    for (const tokenIndex of sampleVector) {
      const token = componentToText(corpus, tokenIndex);
      isStructuralToken(tokenIndex)
        ? uniqueStructuralTokens.add(token)
        : uniqueContentTokens.add(token);
    }

    // Update frequency maps
    for (const token of uniqueStructuralTokens) {
      structuralFrequency.set(token, (structuralFrequency.get(token) || 0) + 1);
    }
    for (const token of uniqueContentTokens) {
      contentFrequency.set(token, (contentFrequency.get(token) || 0) + 1);
    }
  }

  // normalize the frequency maps
  const totalSamples = vectorized.length;
  for (const [token, count] of structuralFrequency.entries()) {
    structuralFrequency.set(token, count / totalSamples);
  }
  for (const [token, count] of contentFrequency.entries()) {
    contentFrequency.set(token, count / totalSamples);
  }

  return { structural: structuralFrequency, content: contentFrequency };
}

/**
 * Generates a frequency vector for a given vector
 * @param vector
 * @param corpus
 * @param freqMaps
 * @returns
 */
export function generateFrequencyVector(
  vector: Vector,
  corpus: VectorizedCorpus,
  freq: CorpusFrequency
): Vector {
  return vector.map((tokenIndex) => {
    const token = componentToText(corpus, tokenIndex);
    const freqMap = isStructuralToken(tokenIndex) ? freq.structural : freq.content;
    if (token === STATIC_TOKEN) return STATIC_TOKEN_FREQUENCY;
    return freqMap.get(token)!;
  });
}

/* Static Related */

/**
 * Creates a new vector with infrequent tokens zeroed out
 * @param vector A vector from the corpus
 * @param corpus Output from vectorizeCorpus function
 * @param corpusFreq Output from generateFrequencyMaps function
 * @returns A new vector with frequent tokens zeroed out
 */
export function applyStaticThreshold(
  vector: Vector,
  corpus: VectorizedCorpus,
  freq: CorpusFrequency,
  threshold: number
): Vector {
  return vector.map((tokenIndex) => {
    const token = componentToText(corpus, tokenIndex);
    const freqMap = isStructuralToken(tokenIndex)
      ? freq.structural
      : freq.content;
    return freqMap.get(token)! > threshold ? STATIC_TOKEN_INDEX : tokenIndex;
  });
}

/**
 * Shortens a vector by reducing consecutive static components to a single static component
 * @param vector
 * @returns
 */
export function compressStaticComponents(vector: Vector): Vector {
  return vector.reduce<Vector>((acc, current) => {
    if (
      isStaticToken(current) &&
      isStaticToken(acc[acc.length - 1])
    ) {
      return acc;
    }
    return [...acc, current];
  }, []);
}

/* Post-Processing */

/**
 * Deduplicates sequences already present in the vector, delimited by STATIC_TOKEN_INDEX
 * @param tokens 
 * @returns 
 */
export function dedupSequences(tokens: Vector): Vector {
  const result: Vector = [];
  const seenSequences: Set<string> = new Set();
  let currentSequence: Vector = [];

  for (let i = 0; i < tokens.length; i++) {
    if (isStaticToken(tokens[i])) {
      // End of a sequence
      if (currentSequence.length > 0) {
        const sequenceString = currentSequence.join(',');
        if (!seenSequences.has(sequenceString)) {
          // This is a new sequence
          result.push(...currentSequence);
          seenSequences.add(sequenceString);
        }
        currentSequence = [];
      }
      result.push(0);
    } else {
      // Part of a sequence
      currentSequence.push(tokens[i]);
    }
  }

  // Handle the last sequence if the vector doesn't end with a static token
  if (currentSequence.length > 0) {
    const sequenceString = currentSequence.join(',');
    if (!seenSequences.has(sequenceString)) {
      result.push(...currentSequence);
    }
  }

  return result;
}