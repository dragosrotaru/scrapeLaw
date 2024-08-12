import { fetchSaveJSON, fileExists, readJSONFile } from "../../utility/io.mts";
import { printProgress } from "../../1-scrape/print.mts";
import { detailFilePath, indexFilePath } from "../../1-scrape/scrape.mts";

const SITE = "canada_princeedwardisland";
const INDEX_FILE_PATH = indexFilePath(SITE);

export const UI_URL = "https://lawsocietypei.ca/find-a-lawyer";
export const API = "https://lawsocietypei.ca/bin/find-a-lawyer.api.php";

export async function index() {
    const body = new FormData();
    body.append("search[name]", "");
    return fetchSaveJSON(INDEX_FILE_PATH, API, {
        method: "POST",
        body,
    });
}

export async function detail() {
    const index = readJSONFile(INDEX_FILE_PATH);
    const count = index.length;

    for (let i = 0; i < count; i++) {
        const record = index[i];
        const id = record.id;
        printProgress(i, count, id);
        const fileName = detailFilePath(SITE)("json")(id);

        // check if file exists
        if (fileExists(fileName)) {
            console.log("exists, skipping ", record.id);
            continue;
        }

        const body = new FormData();
        body.append("profile", record.id);
        await fetchSaveJSON(fileName, API, {
            method: "POST",
            body,
        });
        await new Promise((resolve) => setTimeout(resolve, 50)); // delay 
    }
}