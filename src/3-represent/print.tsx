// 3rd Party
import React from "react";
import { render, Text } from "ink";

// Global
import type { CorpusMaps } from "../interfaces.mts";
import { PRINT_LENGTH } from "../parameters.mts";

// Utility
import type { Vector } from "../utility/types.mts";

import { vectorToText } from "./vector.mts";
/**
 * Pretty Prints a sample to the console
 * @param sample
 */
export function printSample(sample: string): void {
  console.log(JSON.stringify(sample.slice(0, PRINT_LENGTH)));
  console.log(`(first ${PRINT_LENGTH} characters shown) \n`);
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

export function printVectorsWithFrequency(vector: Vector, intensities: Vector, maps: CorpusMaps) {
  const strings = vectorToText(vector, maps);
  render(<ColoredStrings strings={strings} intensities={intensities} />);
}