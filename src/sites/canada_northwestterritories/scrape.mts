import { getDetail, indexFilePath } from "../../1-scrape/scrape.mts";
import { fetchSaveJSON, writeJSONFile } from "../../utility/io.mts";

const SITE = "canada_northwestterritories";
const INDEX_FILE_PATH = indexFilePath(SITE);

const UI_URL = "https://lsnt.ca.thentiacloud.net/webs/lsnt/register/#/search/all/0/10000/0/0/all/0/0/0/all";
const INDEX_URL = "https://lsnt.ca.thentiacloud.net/rest/public/profile/search/?keyword=all&skip=0&take=10000&discipline=0&acceptingReferrals=0&areasOfPractice=all&isNotary=0&acceptsLimitedRetainers=0&proBono=0&language=all&_=1714019440232";
const detailUrl = (id: string) => `https://lsnt.ca.thentiacloud.net/rest/public/profile/get/?id=${id}&_=1714019576462&lang=en`;

export async function index() {
    const json = await fetchSaveJSON(INDEX_FILE_PATH, INDEX_URL);
    json.ids = json.result.map((record: any) => record.id);
    return writeJSONFile(INDEX_FILE_PATH, json);
}

export async function detail() {
    return getDetail(INDEX_FILE_PATH, detailUrl);
}