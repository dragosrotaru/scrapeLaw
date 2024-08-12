import fs from "fs";
import { fetchSaveJSON, fileExists, readJSONFile } from "../../utility/io.mts";
import { ROOT_DATA_PATH } from "../../parameters.mts";
import { printProgress } from "../../1-scrape/print.mts";

const DATA_PATH = ROOT_DATA_PATH + "canada_princeedwardisland/";
const INDEX_FILE_PATH = DATA_PATH + "index.json";
const detailFilePath = (id: string) => DATA_PATH + "detail/" + id + ".json";

export const UI_URL = "https://lawsocietypei.ca/find-a-lawyer";
export const API = "https://lawsocietypei.ca/bin/find-a-lawyer.api.php";

export async function getIndex() {
    const body = new FormData();
    body.append("search[name]", "");
    return fetchSaveJSON(INDEX_FILE_PATH, API, {
        method: "POST",
        body,
    });
}

export async function getDetail() {
    const index = readJSONFile(INDEX_FILE_PATH);
    const count = index.length;

    for (let i = 0; i < count; i++) {
        const record = index[i];
        const id = record.id;
        printProgress(i, count, id);
        const fileName = detailFilePath(id);

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