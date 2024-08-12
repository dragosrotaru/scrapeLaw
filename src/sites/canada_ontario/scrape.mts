import { fetchJSON, fetchSaveText, fileExists, readJSONFile, writeJSONFile } from "../../utility/io.mts";
import { JASON } from "../../utility/types.mts";
import { printProgress } from "../../1-scrape/print.mts";
import { detailFilePath, indexFilePath } from "../../1-scrape/scrape.mts";

const SITE = "canada_ontario";
const INDEX_FILE_PATH = indexFilePath(SITE);

const API_KEY = "REDACTED_LSO_API_KEY";
const INDEX_URL = "https://lawsocietyontario.search.windows.net/indexes/lsolpindexprd/docs?api-version=2017-11-11&$count=true&$top=1000&$skip=";
const DETAIL_URL = "https://lso.ca/public-resources/finding-a-lawyer-or-paralegal/directory-search/member?MemberNumber=";

export async function api(url) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return fetchJSON(url, {
        headers: {
            "api-key": API_KEY
        }
    });
}

export async function index() {
    const results: JASON[] = [];
    // get first page
    const data = await api(INDEX_URL + "0");
    const count = data["@odata.count"];
    console.log("count: ", count);
    results.push(...data.value);

    // get the rest
    for (let i = 1000; i < count; i += 1000) {
        printProgress(i, count, "");
        const data = await api(INDEX_URL + i);
        results.push(...data.value);
    }

    return writeJSONFile(INDEX_FILE_PATH, results);
}

export async function detail(offset = 0) {
    const data = readJSONFile(INDEX_FILE_PATH);
    const count = data.length;

    for (let i = offset; i < count; i++) {
        const item = data[i];
        const id = item.membernumber;
        printProgress(i, count, id);        
        const fileName = detailFilePath(SITE)("html")(id);
        // check if file exists
        if (fileExists(fileName)) {
            console.log("exists, skipping ", id);
            continue;
        }
        fetchSaveText(fileName, DETAIL_URL + id, {
            headers: { 'Accept-Encoding': 'gzip, deflate, br' }
          });
    }
}


