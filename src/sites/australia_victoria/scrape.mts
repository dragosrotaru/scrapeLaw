import { JSDOM } from "jsdom";
import { indexFilePath } from "../../1-scrape/scrape.mts";
import { fetchText, fileExists, readJSONFile, writeJSONFile } from "../../utility/io.mts";
import { printProgress } from "../../1-scrape/print.mts";

const SITE = "australia_victoria";
const INDEX_FILE_PATH = indexFilePath(SITE);

const INDEX_URL = "https://lsbc.vic.gov.au/register-of-lawyers?query=&start_rank=";

export async function index() {
    const index = fileExists(INDEX_FILE_PATH) ? readJSONFile(INDEX_FILE_PATH) : {
        start_rank: 0,
        results: [],
        timestamp: new Date().toISOString(),
    };

    while (true) {
        printProgress(index.start_rank, Infinity, "");
        const html = await fetchText(INDEX_URL + index.start_rank.toString());

        // all divs with search-content class (has divs inside)
        const results = new JSDOM(html).window.document.querySelectorAll("div.search-content");
        
        const has_results = results.length > 0;
        if (!has_results) break;
        
        results.forEach((result) => index.results.push(result.outerHTML));
        
        index.start_rank += results.length;
        
        writeJSONFile(INDEX_FILE_PATH, index);
    }
}