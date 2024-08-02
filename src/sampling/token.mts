import data from "../canada/manitoba/index.json" with { type: "json" };

function fit_exact(corpus: string[], start_window_size: number, threshold: number): [Map<string, number>, string[]] {
    const vocabulary = new Map<string, number>();

    for (let window_size = start_window_size; window_size > 2; window_size--) {
        console.log("window size", window_size);

        // pick a random window of 4 characters from a random text
        const ref_text_index = Math.floor(Math.random() * corpus.length);
        const ref_text = corpus[ref_text_index];

        for (let ref_left = 0; ref_left < corpus[0].length - window_size; ref_left++) {
            let ref_right = ref_left + window_size;
            let ref_window = ref_text.slice(ref_left, ref_right);
            let prev_ref_window;

            while (true) {
                console.log("ref", ref_left, ref_right, ref_window);
                // find the index of every occurence of that window in every text
                const occurences = corpus.map((text) => {
                    const indices: number[] = [];
                    let i = -1;
                    while ((i = text.indexOf(ref_window, i + 1)) !== -1) {
                        indices.push(i);
                    }
                    return indices;
                });

                // check if occurances meet the threshold
                const num_occurences = occurences.filter(
                    (indices) => indices.length > 0
                ).length;
                if (num_occurences >= corpus.length * threshold) {
                    if (prev_ref_window && vocabulary.get(prev_ref_window) === undefined) {
                        // add that window to the vocabulary and remove it from the text
                        vocabulary.set(prev_ref_window, num_occurences);
                        corpus = corpus.map((text) => text.replace(prev_ref_window, ""));
                        console.log("new vocabulary", prev_ref_window, num_occurences);
                    }
                } else {
                    break;
                }

                prev_ref_window = ref_window;

                // switch to the first occurence of the window in the reference text if its not already the first
                const ref_occurences = occurences[ref_text_index];
                const ref_index = ref_occurences.indexOf(ref_left);
                if (ref_index !== 0) {
                    ref_left = ref_occurences[0];
                    ref_right = ref_left + window_size;
                    ref_window = ref_text.slice(ref_left, ref_right);
                }

                // expand the reference window to the left and right until it hits the end of the text
                ref_left = ref_left > 0 ? ref_left - 1 : ref_left;
                ref_right = ref_right < ref_text.length ? ref_right + 1 : ref_right;
                ref_window = ref_text.slice(ref_left, ref_right);
            }
        }
    }

    return [vocabulary, corpus];
}

function fit_stochastic(corpus: string[], start_window_size: number, threshold: number): [Map<string, number>, string[]] {
    const vocabulary = new Map<string, number>();
    let window_size = start_window_size;
    let last_change = Date.now();

    while (true) {
        // if no new vocabulary has been added in a while, decrease the window size
        if (Date.now() - last_change > 2000) {
            if (window_size === 2) break;
            window_size--;
            last_change = Date.now();
            console.log("window size", window_size);
        }

        // if no new vocabulary has been added in real long while, stop
        if (Date.now() - last_change > 60000) {
            console.log("done");
            break;
        }

        // pick a random window of 4 characters from a random text
        const ref_text_index = Math.floor(Math.random() * corpus.length);
        const ref_text = corpus[ref_text_index];
        let ref_left = Math.floor(Math.random() * (ref_text.length - window_size));
        let ref_right = ref_left + window_size;
        let ref_window = ref_text.slice(ref_left, ref_right);
        let prev_ref_window;

        while (true) {
            // find the index of every occurence of that window in every text
            const occurences = corpus.map((text) => {
                const indices: number[] = [];
                let i = -1;
                while ((i = text.indexOf(ref_window, i + 1)) !== -1) {
                    indices.push(i);
                }
                return indices;
            });

            // check if occurances meet the threshold
            const num_occurences = occurences.filter(
                (indices) => indices.length > 0
            ).length;
            if (num_occurences >= corpus.length * threshold) {
                if (prev_ref_window) {
                    // add that window to the vocabulary and remove it from the text
                    vocabulary.set(prev_ref_window, num_occurences);
                    corpus = corpus.map((text) => text.replace(prev_ref_window, ""));
                    last_change = Date.now();
                    console.log("new vocabulary", prev_ref_window, num_occurences);
                }
            } else {
                break;
            }

            prev_ref_window = ref_window;

            // switch to the first occurence of the window in the reference text if its not already the first
            const ref_occurences = occurences[ref_text_index];
            const ref_index = ref_occurences.indexOf(ref_left);
            if (ref_index !== 0) {
                ref_left = ref_occurences[0];
                ref_right = ref_left + window_size;
                ref_window = ref_text.slice(ref_left, ref_right);
            }

            // expand the reference window to the left and right until it hits the end of the text
            ref_left = ref_left > 0 ? ref_left - 1 : ref_left;
            ref_right = ref_right < ref_text.length ? ref_right + 1 : ref_right;
            ref_window = ref_text.slice(ref_left, ref_right);
        }
    }

    return [vocabulary, corpus];
}

// iterate over threshold values
let corpus = data.results;
let window_size = 25;
let threshold_decay = 0.1;

const vocabulary = new Map<string, number>();

for (let threshold = 1; threshold > 0.05; threshold -= threshold_decay) {
    console.log("threshold", threshold);
    let [vocab, new_corpus] = fit_exact(corpus, window_size, threshold);
    // add new vocabulary to the existing vocabulary
    for (const [word, freq] of vocab.entries()) {
        vocabulary.set(word, (vocabulary.get(word) ?? 0) + freq);
    }
    corpus = new_corpus;
}

console.log("final vocabulary");
console.log([...vocabulary.entries()]);