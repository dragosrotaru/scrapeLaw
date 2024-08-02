import { shortestString } from "./sample.mts";

/**
 * Remove common prefix and postfix from a corpus
 * @param corpus
 * @returns
 */
export function isolateCorpus(corpus: string[]) {
  // We get the static prefix and postfix of the corpus
  const prefix = findStaticPrefix(corpus);
  const postfix = findStaticPostfix(corpus);

  // Strip the prefix and postfix from the corpus
  corpus = corpus.map((sample) => sample.substring(prefix.length));
  corpus = corpus.map((sample) =>
    sample.substring(0, sample.length - postfix.length)
  );

  return { prefix, postfix, corpus };
}

/**
 * Returns the longest prefix that is the same in all strings, respecting HTML tag boundaries
 * @param corpus
 * @returns
 */
function findStaticPrefix(corpus: string[]): string {
  if (corpus.length === 0) return "";
  let staticPrefix = "";
  let index = 0;
  const shortestSample = shortestString(corpus);
  
  while (index < shortestSample.length) {
      const char = shortestSample[index];
      if (corpus.every((sample) => sample[index] === char)) {
          staticPrefix += char;
          index++;
          
          // If we're inside a tag, continue until we find the closing '>'
          if (char === '<') {
              while (index < shortestSample.length && shortestSample[index] !== '>') {
                  if (corpus.every((sample) => sample[index] === shortestSample[index])) {
                      staticPrefix += shortestSample[index];
                      index++;
                  } else {
                      return staticPrefix.substring(0, staticPrefix.lastIndexOf('<'));
                  }
              }
              if (index < shortestSample.length && corpus.every((sample) => sample[index] === '>')) {
                  staticPrefix += '>';
                  index++;
              } else {
                  return staticPrefix.substring(0, staticPrefix.lastIndexOf('<'));
              }
          }
      } else {
          break;
      }
  }
  return staticPrefix;
}

/**
* Returns the longest postfix that is the same in all strings, respecting HTML tag boundaries
* @param corpus
* @returns
*/
function findStaticPostfix(corpus: string[]): string {
  if (corpus.length === 0) return "";
  let staticPostfix = "";
  let index = 0;
  const shortestSample = shortestString(corpus);
  
  while (index < shortestSample.length) {
      const char = shortestSample[shortestSample.length - index - 1];
      if (corpus.every((sample) => sample[sample.length - index - 1] === char)) {
          staticPostfix = char + staticPostfix;
          index++;
          
          // If we're inside a tag, continue until we find the opening '<'
          if (char === '>') {
              while (index < shortestSample.length && shortestSample[shortestSample.length - index - 1] !== '<') {
                  if (corpus.every((sample) => sample[sample.length - index - 1] === shortestSample[shortestSample.length - index - 1])) {
                      staticPostfix = shortestSample[shortestSample.length - index - 1] + staticPostfix;
                      index++;
                  } else {
                      return staticPostfix.substring(staticPostfix.indexOf('>') + 1);
                  }
              }
              if (index < shortestSample.length && corpus.every((sample) => sample[sample.length - index - 1] === '<')) {
                  staticPostfix = '<' + staticPostfix;
                  index++;
              } else {
                  return staticPostfix.substring(staticPostfix.indexOf('>') + 1);
              }
          }
      } else {
          break;
      }
  }
  return staticPostfix;
}