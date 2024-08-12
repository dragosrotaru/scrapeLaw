import { printProgress } from "../../1-scrape/print.mts";
import { detailFilePath } from "../../1-scrape/scrape.mts";
import { ROOT_DATA_PATH } from "../../parameters.mts";
import { fetchSaveText, fetchText, fileExists, readJSONFile, writeJSONFile } from "../../utility/io.mts";


const DATA_PATH = ROOT_DATA_PATH + "new_zealand_barrister/";
const INDEX_FILE_PATH = DATA_PATH + "index.json";

const INDEX_URL = "https://www.nzbar.org.nz/individual-directory?page=88";
const DETAIL_URL = "https://www.nzbar.org.nz/node/";

// about 16,401 practicing certificate lawyers, but the results max out at 10000.

async function getIndex() {
    const index = fileExists(INDEX_FILE_PATH) ? readJSONFile(INDEX_FILE_PATH) : {
        page: 1,
        results: [],
    };

    while (true) {
        const url = new URL(INDEX_URL);
        url.searchParams.set('page', index.page);
        const html = await fetchText(url.toString());


        // match the number id in href="/node/25515" 
        const match = html.match(/href="\/node\/(\d+)/g);
        if (!match) break;
        const ids = match.map(m => m.match(/href="\/node\/(\d+)/)![1]);
        const uniques = ids.filter(id => !index.results.includes(id));
        if (uniques.length === 0) break;
        
        index.results.push(...uniques);
        
        printProgress(index.page, Infinity, ids.length.toString());
        writeJSONFile(INDEX_FILE_PATH, index);
        index.page++;
    }
}

export async function getDetail() {
    const { results } = readJSONFile(INDEX_FILE_PATH);
    // deduplicate
    const unique: string[] = [...new Set<string>(results)];
    const count = unique.length;

    for (let i = 0; i < count; i++) {
        const id = unique[i];
        printProgress(i, count, id);
        
        const fileName = detailFilePath(DATA_PATH)(id);
        if (fileExists(fileName)) {
            console.log('skipping', id);
            continue;
        }
        await fetchSaveText(fileName, DETAIL_URL + id);
    }
}