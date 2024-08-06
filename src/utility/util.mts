/**
 * Generates a random sample from a generic array, can pick the same element multiple times
 * @param max
 * @param count
 * @returns
 */
export function selectRandomSample<T>(array: T[], count: number = 1): T[] {
  return Array.from(
    { length: count },
    () => array[Math.floor(Math.random() * array.length)]
  );
}

/**
 * Applies a series of regex replacements to a string
 * @param html
 * @param regex
 * @returns
 */
export const replaceRegex = (string: string, regex: [RegExp, string][]) => {
  for (const [r, s] of regex) {
    string = string.replace(r, s);
  }
  return string;
};

/**
 * Returns the average length of strings in an array
 * @param strings
 * @returns
 */
export function averageStringLength(strings: string[]): number {
  return (
    strings.reduce((acc, sample) => acc + sample.length, 0) / strings.length
  );
}

/**
 * Returns the shortest string in an array of strings
 * @param strings
 * @returns
 */
export function shortestString(strings: string[]): string {
  return strings.reduce((shortest, current) =>
    current.length < shortest.length ? current : shortest
  );
}

/**
 * Returns the longest string in an array of strings
 * @param strings
 * @returns
 */
export function longestString(strings: string[]): string {
  return strings.reduce((longest, current) =>
    current.length > longest.length ? current : longest
  );
}