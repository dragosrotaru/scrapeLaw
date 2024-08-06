
// Utility
import type { Vector } from "../utility/types.mts";
import { selectRandomSample } from "../utility/util.mts";
import { printColoredStrings } from "../utility/print.tsx";

// Prior Step
import { prepare } from "../2-prepare/index.mts";

// This Step
import { outlierDetection } from "./outlier.mts";
import { applyStaticThreshold, compressStaticComponents, dedupSequences, generateFrequencyMaps, generateFrequencyVector, isStructuralToken, vectorizeCorpus, vectorToText } from "./vector.mts";

export function represent() {
    // prior step
    const { analysis, corpus: textCorpus } = prepare();

    // generate vectorized corpus with maps
    console.log("Vectorizing Corpus \n");
    const corpus = vectorizeCorpus(textCorpus);
    const freq = generateFrequencyMaps(corpus);

    // outlier detection
    console.log("\n Outlier Detection \n");
    const outlier = outlierDetection(corpus, freq);

    // pick a sample
    const sample = selectRandomSample(corpus.vectorized, 1)[0];

    // apply static threshold
    const zeroedOut = applyStaticThreshold(
      sample,
      corpus,
      freq,
      outlier.meanStablePoint
    );

    // compress static components
    const compressed = compressStaticComponents(zeroedOut);

    // filter out strutural tokens
    const filtered = compressed.filter((v) => !isStructuralToken(v));

    // deduplicate sequences
    const deduplicated = dedupSequences(filtered);

    // print sample
    const sampleTokens = vectorToText(deduplicated, corpus);
    const sampleFreq = generateFrequencyVector(deduplicated, corpus, freq);

    // filter out textual tokens
    const text: string[] = [];
    const freqVec: Vector = [];
    for (let index = 0; index < sampleTokens.length; index++) {
      const textComp = sampleTokens[index];
      const freqComp = sampleFreq[index];

      // filter out URLs
      if (textComp.startsWith("http")) continue;
      if (textComp.startsWith("javascript:")) continue
      if (textComp.startsWith("mailto:")) continue

      text.push(textComp);
      freqVec.push(freqComp);
    }

    printColoredStrings(text, freqVec);

    return text;
}