// Utility
import { fetchSaveJSON, readJSONFile } from "../../utility/io.mts";

// This Step
import { printProgress } from "../../1-scrape/print.mts";
import { detailFilePath, indexFilePath } from "../../1-scrape/scrape.mts";

export const UI_URL = "https://sabar.org.au/barrister-search/#!directory/map/ord=lnm";
export const BASE_URL = "https://api.membershipworks.com/v2/";
export const INDEX_URL =  BASE_URL + "directory?_st=&_rf=Members";
export const detailUrl = (id: string) => BASE_URL + `account/${id}/profile`;

export const SITE = "australia_southaustralia_barrister";
export const INDEX_FILE_PATH = indexFilePath(SITE);

const headers =  {
    "X-Org": "20487",
};

export async function index() {
    return fetchSaveJSON(INDEX_URL, INDEX_FILE_PATH, { headers });
}

export async function detail() {
    const { usr: index } = readJSONFile(INDEX_FILE_PATH);
    const count = index.length;
    for (let i = 0; i < count; i++) {
        const id = index[i].uid;
        printProgress(i, count, id);
        await fetchSaveJSON(detailUrl(id), detailFilePath(SITE)("json")(id), { headers });
    }
}