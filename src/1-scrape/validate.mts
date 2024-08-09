// 3rd Party
import * as validate from "html-validate/node";

// Global
import type { CorpusFiles } from "../interfaces.mts";


// https://validator.w3.org/nu

async function validateHTML(files: CorpusFiles) {
  // todo pick ruleset
  const htmlvalidate = new validate.HtmlValidate({ extends: ["html-validate:recommended"] });
  // todo standardize the format of the corpus files so we can merge reports

  const invalid: {
    sample: { id: string; data: string };
    report: validate.Report;
  }[] = [];
  for (let i = 0; i < files.length; i++) {
    console.log("validating", i, "of", files.length);
    const sample = files[i];
    const report = await htmlvalidate.validateString(sample.data);
    if (!report.valid) invalid.push({ sample, report });
  }
  // todo collect all breaking validation errors
  console.log("invalid samples", invalid.length);
  invalid[0].report.results.map((result) => {
    console.log(result.filePath);
    console.log(result.errorCount);
    console.log(result.warningCount);
    console.log(result.source);
    result.messages.map((message) => {
      console.log(message);
    });
  });
  console.log(invalid[0].report.errorCount);
  console.log(invalid[0].report.warningCount);
}