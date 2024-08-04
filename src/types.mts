export type NullableString = string | null;

export type TextCorpus = string[];

export type Data = {
  data: NullableString;
  prefix: NullableString;
  postfix: NullableString;
};

export type Field = {
  fieldName: string;
  nullable: boolean;
  prefixes: string[];
  postfixes: string[];
  data: Data[];
};

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
  fields: Field[];
};

export type Sample = {
    input: string;
    output: Record<string, NullableString>;
}

export type Datum = Record<string, NullableString>;