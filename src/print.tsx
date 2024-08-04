import React from "react";
import { render, Text } from "ink";
import type { Analysis } from "./types.mts";

/**
 * Pretty Prints a sample to the console
 * @param sample
 */
export function printSample(sample: string) {
  const PRINT_LENGTH = 256;
  console.log(JSON.stringify(sample.slice(0, PRINT_LENGTH)));
  console.log(`(first ${PRINT_LENGTH} characters shown) \n`);
}

/**
 * Prints the statistics of the analysis to the console
 * @param stats
 */
export function printStats(stats: Analysis["stats"]) {
  console.log("Statistics:");
  console.log("Number of Samples:", stats.corpusSize);
  console.log("Prefix Length:", stats.prefixLength);
  console.log("Postfix Length:", stats.postFixLength);
  console.log("Average Sample Length:", stats.averageLength);
  console.log("Min Sample Length:", stats.minLength);
  console.log("Max Sample Length:", stats.maxLength);
}


function ColoredStrings(props: { strings: string[], intensities: number[] }) {
  const { strings, intensities } = props;
  if (strings.length !== intensities.length) {
    console.error('Error: Arrays must be of equal length');
    return null;
  }

  return (
    <Text>
      {strings.map((str, i) => {
        const intensity = intensities[i];
        const colorValue = Math.round(255 * (1 - intensity));
        return (
          <Text key={i} color={`rgb(${colorValue},${colorValue},${colorValue})`}>
            {str + ' '}
          </Text>
        );
      })}
    </Text>
  );
}

export function printColoredStrings(strings: string[], intensities: number[]) {
  render(<ColoredStrings strings={strings} intensities={intensities} />);
}