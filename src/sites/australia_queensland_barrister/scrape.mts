// Global
import { printProgress } from "../../1-scrape/print.mts";
import { detailFilePath, indexFilePath } from "../../1-scrape/scrape.mts";

// Utility
import { fetchSaveJSON, readJSONFile } from "../../utility/io.mts";

const UI_URL = "https://qldbar.asn.au/barrister-search";
const BASE_URL = "https://qldbar.asn.au/baq/v1/search/";
const INDEX_URL = BASE_URL + "fab";
const DETAIL_URL = BASE_URL + "getMemberDetails/";

const headers = {
    "BAQAuth": "Q9MLYo7giVGr",
    "X-Requested-With": "XMLHttpRequest",
    "X-XSRF-TOKEN": "REDACTED",
    "Cookie": "JSESSIONID=REDACTED; XSRF-TOKEN=REDACTED",
};

const SITE = "australia_queensland_barrister";
const INDEX_FILE_PATH = indexFilePath(SITE);

export async function index() {
    return fetchSaveJSON(INDEX_FILE_PATH, INDEX_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
            fullList: true,
            areaOfPractice: "-1",
            aopGroup: null,
            aboriginal: -1,
            gender: -1,
            counselType: -1,
            regionId: -1,
            nationalAccreditedMediator:-1,
            memberType:-1,
            location:-1,
            jurisdiction:-1
        })
    });
  }

export async function detail() {
    const index = readJSONFile(INDEX_FILE_PATH);
    const barristers = index.barristerList;
    const count = barristers.length;
    for (let i = 0; i < count; i++) {
        const { id } = barristers[i];
        printProgress(i, count, id);
        fetchSaveJSON(DETAIL_URL + id, detailFilePath(SITE)("json")(id), { headers });
    }
}