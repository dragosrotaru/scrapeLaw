

export type TextCorpus = string[];

export type Analysis = {
  stats: {
    corpusSize: number;
    averageLength: number;
    minLength: number;
    maxLength: number;
    postFixLength: number;
    prefixLength: number;
  };
  shortestSample: string;
  longestSample: string;
  prefix: string;
  postfix: string;
};
