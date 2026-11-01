import { getDetail, indexFilePath, indexHTMLFilePath } from "../../1-scrape/scrape.mts";
import { fetchSaveText, writeJSONFile } from "../../utility/io.mts";

const SITE = "canada_yukon";
const INDEX_HTML_FILE_PATH = indexHTMLFilePath(SITE);
const INDEX_FILE_PATH = indexFilePath(SITE);

const INDEX_URL = "https://lawsocietyyukon.com/find-a-lawyer/";
const DETAIL_URL = "https://lawsocietyyukon.com/lawyer/";
const detailUrl = (id: string) => `${DETAIL_URL}${id}/`;

export async function index() {
  const html = await fetchSaveText(INDEX_HTML_FILE_PATH, INDEX_URL);
  
  // all hrefs with link: https://lawsocietyyukon.com/lawyer/
  const regex = /href="(https:\/\/lawsocietyyukon\.com\/lawyer\/[^"]+)"/g;
  
  const ids = Array.from(html.matchAll(regex), (match) => {
    // URL may or may not end in a trailing slash. needs to be removed
    const url = new URL(match[1]);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1];
  });
  
  writeJSONFile(INDEX_FILE_PATH, { ids, timestamp: new Date().toISOString() });
}

export async function detail() {
  return getDetail(SITE, detailUrl);
}