// Utility
import { writeJSONFile } from "../../utility/io.mts";

// This Step
import { getDetail, indexFilePath, indexHTMLFilePath } from "../../1-scrape/scrape.mts";

// shows all on one page, includes email website and all the goodies

const SITE = "canada_novascotia";
const INDEX_FILE_PATH = indexFilePath(SITE);
const INDEX_HTML_FILE_PATH = indexHTMLFilePath(SITE);

const BASE_URL = "https://members.nsbs.org/NSBSWEB/Lawyer_Search/";
export const INDEX_URL = BASE_URL + "Search_Page.aspx";
export const DETAIL_URL = BASE_URL + "Results_Page2.aspx?ID=";
const getDetailUrl = (id: string) => DETAIL_URL + id;

export async function index() {
  // todo
  // get every <a title="View Details" href="/NSBSWEB/Lawyer_Search/Results_Page2.aspx?ID=103792"> from index file and download the page
  const index = "";
  const regex = /<a title="View Details" href="([^"]+)">/g;
  const ids = [...index.matchAll(regex)].map((a) => a[1].split("=")[1]);
  writeJSONFile(INDEX_FILE_PATH, { ids, timestamp: new Date().toISOString() });
}

export async function detail() {
  return getDetail(SITE, getDetailUrl);
}
