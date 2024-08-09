// 3rd Party
import { ZodError, ZodSchema } from "zod";

// Global
import { Sample } from "../interfaces.mts";

/**
 * Run the unit tests
 */
export function unit(examples: Sample[], dataset: Sample[]) {
    console.log("sample count", examples.length);
    for (const example of examples) {
        // find the output of the regularized dataset
        const output = dataset.find((d) => d.id === example.id)?.data;

        // iterate over all fields in the output
        for (const [field, expected] of Object.entries(example.data)) {
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
            if (!Object.keys(example.data).includes(field)) {
                console.log("extra field", field);
            }
        }

    }
}

/**
 * Validate the regularized dataset against the schema
 */
export function schema(site: string, dataset: Sample[], schema: ZodSchema): { sample: Sample, errors: ZodError}[] {
    const errors: { sample: Sample, errors: ZodError}[] = [];
    for (const sample of dataset) {
        const parsed = schema.safeParse(sample.data);
        if (!parsed.success) {
            errors.push({ sample, errors: parsed.error });
        }
    }
    console.log("errors found:", errors.length);
    return errors;
}