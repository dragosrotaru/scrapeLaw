import { schema as schem } from "./data/canada/manitoba/schema.mts";
import { SAMPLE_FILE, DATASET_FILE, REGULAR_FILE, CORPUS_FILE, SCHEMA_ERRORS, CORPUS_PATH } from "./files.mts";
import { loadCorpusFiles, readJSON, writeJSON } from "./io.mts";
import { htmlToText } from "./process.mts";
import type { Datum, Sample } from "./types.mts";

/**
 * Regularize the dataset to nullable text fields and Sample format
 */
function regularize() {
    const dataset = readJSON(DATASET_FILE) as Datum[];
    // const corpus = readJSON(CORPUS_FILE).results as string[];
    const corpus = loadCorpusFiles(CORPUS_PATH);
    const regular = corpus.map((input, index) => {
        const output = dataset[index];
        for (const [field, value] of Object.entries(output)) {
            output[field] = htmlToText(value);
        }
        return { input: input.data, output };
    });
    writeJSON(REGULAR_FILE, regular);
    console.log("regularized", regular.length);
}

/**
 * Run the unit tests
 */
function unit() {
    const samples = readJSON(SAMPLE_FILE) as Sample[];
    const regular = readJSON(REGULAR_FILE) as Sample[];
    console.log("sample count", samples.length);
    for (const sample of samples) {
        // find the output of the regularized dataset
        const index = regular.findIndex((item) => item.input === sample.input);
        const { output } = regular[index];

        // iterate over all fields in the output
        for (const [field, expected] of Object.entries(sample.output)) {
            const actual = output[field];

            // check if the field exists
            if (actual === undefined || expected === undefined) {
                if (actual !== expected) {
                    console.log("field not found in output", field);
                }
                continue;
            }
            // check if the field is null
            if (actual === null || expected === null) {
                if (actual !== expected) {
                    console.log("value mismatch", field, expected, actual);
                }
                continue;
            }

            // check if the value matches
            if (expected !== actual) {
                console.log("value mismatch", field);
                console.log("expected", expected);
                console.log("actual", actual);
            }
        }

        // check for extra fields
        for (const field of Object.keys(output)) {
            if (!Object.keys(sample.output).includes(field)) {
                console.log("extra field", field);
            }
        }

    }
}

/**
 * Validate the regularized dataset against the schema
 */
function schema() {
    const regular = readJSON(REGULAR_FILE) as Sample[];
    const errors: any[] = [];
    for (const sample of regular) {
        const { output } = sample;
        const parsed = schem.safeParse(output);
        if (!parsed.success) {
            errors.push({ sample, errors: parsed.error });
        }
    }
    console.log("errors found:", errors.length);
    writeJSON(SCHEMA_ERRORS, errors);
}