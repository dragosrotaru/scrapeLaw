// Global
import { getDetail, indexFilePath } from "../../1-scrape/scrape.mts";

// Utility
import {
  fetchText,
  writeJSONFile,
} from "../../utility/io.mts";

const INDEX_URL =
  "https://tasbar.com.au/barristers/?f_field=&f_region=&f_name=";
const DETAIL_URL = "https://tasbar.com.au/barrister/";
const detailUrl = (id: string) => DETAIL_URL + id;

const SITE = "australia_tasmania";
const INDEX_FILE_PATH = indexFilePath(SITE);

export async function getIndex() {
  const html = await fetchText(INDEX_URL);
  // todo save html

  // <a href="https://tasbar.com.au/barrister/albert-dinelli/" class="barrister__inner">
  const regex = /<a href="([^"]+)" class="barrister__inner">/g;
  const ids = [...html.matchAll(regex)].map((match) =>
    match[1].replace(DETAIL_URL, "").replace("/", "")
  );

  writeJSONFile(INDEX_FILE_PATH, { ids, timestamp: new Date().toISOString() });
}

export async function detail() {
    return getDetail(SITE, detailUrl);
}
