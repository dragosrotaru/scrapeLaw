// website: https://lawsociety.mb.ca/for-the-public/finding-a-lawyer/lawyer-lookup/

import fs from "fs";

const index_url = "https://portal.lawsociety.mb.ca/lookup/action.php?sort=contact&dir=1&query="

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function getIndex() {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    let index = {
        last: "aa",
        results: [],
    }; // Default starting combo

    // Read the last completed combo from file if exists
    if (fs.existsSync('index.json')) {
        index = JSON.parse(fs.readFileSync('index.json', 'utf8'));
    }

    let startIndex = characters.indexOf(index.last[0]);
    let startSubIndex = characters.indexOf(index.last[1]) + 1;

    for (let i = startIndex; i < characters.length; i++) {
        for (let j = (i === startIndex ? startSubIndex : 0); j < characters.length; j++) {
            const combo = characters[i] + characters[j];

            const response = await fetch(index_url + combo, );
            const data = await response.text();

            // rejex all the table rows INSIDE of table body (NOT INCLUDING Table HEAD)
            const table_body = data.match(/<tbody>(.*?)<\/tbody>/gs);
            if (!table_body) {
                console.log("No results found for", combo);
                continue;
            }
            const results = table_body[0].match(/<tr>(.*?)<\/tr>/gs);

            // log combo and number of results
            console.log(combo, results.length);
            index.last = combo;

            index.results.push(...results);

            // Save current combo to file
            fs.writeFileSync('index.json', JSON.stringify(index, null, 4));
            startSubIndex = 0; // Reset for next iterations

            // Sleep for 100ms to prevent getting blocked
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}

export function dedupIndex() {
    const index = JSON.parse(fs.readFileSync('index.json', 'utf8'));
    index.results = [...new Set(index.results)];

    fs.writeFileSync('index.json', JSON.stringify(index, null, 4));
}