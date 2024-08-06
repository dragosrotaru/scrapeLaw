// 3rd Party
import React from "react";
import { render, Text } from "ink";

/**
 * Pretty Prints a sample to the console
 * @param sample
 */
export function printSample(sample: string) {
  const PRINT_LENGTH = 256;
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

export function printColoredStrings(strings: string[], intensities: number[]) {
  render(<ColoredStrings strings={strings} intensities={intensities} />);
}