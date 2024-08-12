import { printProgress } from "../../1-scrape/print.mts";
import { getDetail, indexFilePath } from "../../1-scrape/scrape.mts";
import { fetchText, fileExists, readJSONFile, writeJSONFile } from "../../utility/io.mts";


export const SITE = "new_zealand_barrister";
const INDEX_FILE_PATH = indexFilePath(SITE);

const BASE_URL = "https://www.nzbar.org.nz/";
const INDEX_URL = BASE_URL + "individual-directory?page=";
const DETAIL_URL = BASE_URL + "node/";
const detailUrl = (id: string) => DETAIL_URL + id;

// about 16,401 practicing certificate lawyers, but the results max out at 10000.

export async function index() {
    const index = fileExists(INDEX_FILE_PATH) ? readJSONFile(INDEX_FILE_PATH) : {
        page: 1,
        ids: [],
    };

    while (true) {
        const html = await fetchText(INDEX_URL + index.page.toString());

        // match the number id in href="/node/25515" 
        const ids = [...html.matchAll(/href="\/node\/(\d+)/g)].map(m => m[1]);
        const uniques = ids.filter(id => !index.ids.includes(id));
        if (uniques.length === 0) break;
        
        index.ids.push(...uniques);
        
        printProgress(index.page, Infinity, ids.length.toString());
        writeJSONFile(INDEX_FILE_PATH, index);
        index.page++;
    }


}

export async function detail() {
    return getDetail(SITE, detailUrl);
}