// Global
import { printProgress } from "../../1-scrape/print.mts";
import { ROOT_DATA_PATH } from "../../parameters.mts";

// Utility
import { fetchSaveText, fetchText, readJSONFile, writeJSONFile } from "../../utility/io.mts";

const INDEX_URL = "https://tasbar.com.au/barristers/?f_field=&f_region=&f_name=";
const detailUrl = (id: string) => `https://tasbar.com.au/barrister/${id}`;

const DATA_PATH = ROOT_DATA_PATH + "australia_tasmania/";
const INDEX_FILE_PATH = DATA_PATH + "index.json";
const detailFilePath = (id: string) => `${DATA_PATH}detail/${id}.html`;

export async function getIndex() {
    const html = await fetchText(INDEX_URL);
    
    // <a href="https://tasbar.com.au/barrister/albert-dinelli/" class="barrister__inner">
    const regex = /<a href="([^"]+)" class="barrister__inner">/g;
    const matches = [...html.matchAll(regex)];
    
    const barristerIds = matches
        .map((match) => match[1])
        .map(u => u.replace("https://tasbar.com.au/barrister/", ""))
        .map(u => u.replace("/", ""));

    writeJSONFile(INDEX_FILE_PATH, barristerIds);
}

export async function getDetail() {
    const ids = readJSONFile(INDEX_FILE_PATH);
    const count = ids.length;
    for (let i = 0; i < count; i++) {
        const id = ids[i];
        printProgress(i, count, id);
        await fetchSaveText(detailFilePath(id), detailUrl(id));
    }
}