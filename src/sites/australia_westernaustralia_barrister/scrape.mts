import { getDetail, indexFilePath } from "../../1-scrape/scrape.mts";
import { fetchText, writeJSONFile } from "../../utility/io.mts";

const SITE = "australia_westernaustralia_barrister";
const INDEX_FILE_PATH = indexFilePath(SITE);

const INDEX_URL = "https://www.wabar.asn.au/find-a-barrister/view-all-barristers/";
const detailUrl = (barrister: string) => `https://www.wabar.asn.au/barrister/${barrister}/`;

export async function index() {
    const html = await fetchText(INDEX_URL);
    
    // regex all hrefs <a href="https://www.wabar.asn.au/barrister/[CONTENT]/">Abbott, Geoff</a>
    const regex = /<a href="https:\/\/www.wabar.asn.au\/barrister\/([^"]+)">[^<]+<\/a>/g;
    const ids: string[] = [];

    let match;
    while ((match = regex.exec(html)) !== null) {
        ids.push(match[1].replace('/', ''));
    }

    if (!ids) {
        console.log("No results found");
        return;
    }

    return writeJSONFile(INDEX_FILE_PATH, { ids });
}

export async function detail() {
    return getDetail(SITE, detailUrl);
}