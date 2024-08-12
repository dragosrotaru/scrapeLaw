import { dataPath, getDetail, indexFilePath } from "../../1-scrape/scrape.mts";
import { fetchSaveText, writeJSONFile } from "../../utility/io.mts";

const SITE = "canada_yukon";
const DATA_PATH = dataPath(SITE);
const INDEX_HTML_FILE_PATH = DATA_PATH + "index.html";
const INDEX_FILE_PATH = indexFilePath(SITE);

const INDEX_URL = "https://lawsocietyyukon.com/find-a-lawyer/";
const detailUrl = (id: string) => `https://lawsocietyyukon.com/lawyer/${id}/`;

export async function getIndex() {
    const html = await fetchSaveText(INDEX_HTML_FILE_PATH, INDEX_URL);
    // all hrefs with link: https://lawsocietyyukon.com/lawyer/
    const regex = /href="https:\/\/lawsocietyyukon.com\/lawyer\/[^"]+"/g;
    const ids = [...html.matchAll(regex)]
        .map(m => m[0])
        .map(m => m.slice(6, -1)) // remove href="..."
        .map(url => {
            // URL may or may not end in a trailing slash. needs to be removed
            const parts = new URL(url).pathname.split("/");
            if (parts[parts.length - 1] === "") parts.pop();
            const id = parts.pop();
            return id;
        })
    writeJSONFile(INDEX_FILE_PATH, { ids });
};

export async function getDetails() {
    return getDetail(SITE, detailUrl);
}