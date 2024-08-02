import data from "../canada/manitoba/index.json" with { type: "json" };

class BytePairEncoding {
    vocabulary: Map<string, number>  = new Map();
    merges: Map<string, string>  = new Map();

    private incrementVocabulary(word: string): void {
        this.vocabulary.set(word, (this.vocabulary.get(word) ?? 0) + 1);
    }

    private normalizeText(text: string): string {
        const tokens = text.split('');
        tokens.push('</w>');
        return tokens.join(' ');
    }

    // Get all pairs of characters in a word
    private getPairs(word: string[]): Set<[string, string]> {
        const pairs = new Set<[string, string]>();
        for (let i = 0; i < word.length - 1; i++) {
            pairs.add([word[i], word[i + 1]]);
        }
        return pairs;
    }

    // Merge a pair of characters in a word
    private mergeWord(word: string[], pair: [string, string]): string[] {
        const newWord: string[] = [];
        let i = 0;
        while (i < word.length) {
            if (i < word.length - 1 && word[i] === pair[0] && word[i + 1] === pair[1]) {
                newWord.push(pair.join(''));
                i += 2;
            } else {
                newWord.push(word[i]);
                i++;
            }
        }
        return newWord;
    }

    public fit(corpus: string[], numMerges: number): void {
        this.vocabulary.clear();
        this.merges.clear();

        for (const text of corpus) this.incrementVocabulary(this.normalizeText(text));

        for (let i = 0; i < numMerges; i++) {
            
            // Count the frequency of all pairs
            const pairs = new Map<string, number>();
            for (const [word, freq] of this.vocabulary.entries()) {
                const wordList = word.split(' ');
                for (const pair of this.getPairs(wordList)) {
                    const pairStr = pair.join(' ');
                    pairs.set(pairStr, (pairs.get(pairStr) ?? 0) + freq);
                }
            }

            if (pairs.size === 0) break;

            const mostCommonPair = [...pairs.entries()].reduce((a, b) => (a[1] > b[1] ? a : b))[0];
            const [first, second] = mostCommonPair.split(' ');
            this.merges.set(mostCommonPair, `${first}${second}`);

            const newVocabulary = new Map<string, number>();
            for (const [word, freq] of this.vocabulary.entries()) {
                const newWord = this.mergeWord(word.split(' '), [first, second]);
                newVocabulary.set(newWord.join(' '), (newVocabulary.get(newWord.join(' ')) ?? 0) + freq);
            }
            this.vocabulary = newVocabulary;
        }
    }

    public encode(text: string): string[] {
        let tokens = text.split('');
        tokens.push('</w>');
        let pairStr: string;
        do {
            const pairs = this.getPairs(tokens);
            pairStr = [...pairs.values()]
                .map(pair => pair.join(' '))
                .find(pair => this.merges.has(pair)) ?? '';
            if (pairStr) {
                tokens = this.mergeWord(tokens, pairStr.split(' ') as [string, string]);
            }
        } while (pairStr);
        return tokens;
    }

}

// Example Usage:
const bpe = new BytePairEncoding();
const corpus = data.results;
bpe.fit(corpus, 100);
console.log([...bpe.vocabulary.entries()]); // Vocabulary
console.log([...bpe.merges.entries()]); // Merges
console.log(bpe.encode("<tr><td><strong>Doe, Jane</strong><br />123 Example St.<br />Phone: 555-0100</td></tr>"));
