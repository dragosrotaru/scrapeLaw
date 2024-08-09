import { readTextFilesDir } from "./utility/io.mts";
import { JASON, Vector } from "./utility/types.mts";

// Scrape

export type CorpusFiles = ReturnType<typeof readTextFilesDir>;

// Prepare

export type TextCorpus = string[];

export interface Analysis {
  stats: {
    corpusSize: number;
    averageLength: number;
    minLength: number;
    maxLength: number;
    postFixLength: number;
    prefixLength: number;
    reduction: number;
  };
  shortestSample: string;
  longestSample: string;
  prefix: string;
  postfix: string;
};

// Represent

export type VectorCorpus = Vector[];

export type TokenMap = Map<string, number>;

export interface CorpusMaps {
  structuralMap: TokenMap;
  contentMap: TokenMap;
};

export interface CorpusFrequency {
  structural: TokenMap;
  content: TokenMap;
};

export interface Outlier {
  outliers: [Vector, number][];
  diffSet: Set<number>;
  meanStablePoint: number;
}

export interface PreparedCorpus {
  analysis: Analysis;
  corpus: TextCorpus;
}

export type Output = [Vector, Vector];

export interface Representation {
  preparation: PreparedCorpus;
  vectorized: Vector[];
  maps: CorpusMaps;
  freq: CorpusFrequency;
  output: Output[];
  outlier: Outlier;
}

export interface Sample {
  id: string;
  data: JASON;
}