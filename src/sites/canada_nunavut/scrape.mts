import {
  getDetail,
  indexFilePath,
  indexHTMLFilePath,
} from "../../1-scrape/scrape.mts";
import {

  writeJSONFile,
  writeTextFile,
} from "../../utility/io.mts";

const SITE = "canada_nunavut";
const INDEX_FILE_PATH = indexFilePath(SITE);
const INDEX_HTML_FILE_PATH = indexHTMLFilePath(SITE);

const INDEX_URL =
  "https://www.lawsociety.nu.ca/en/for-the-public/membership-directory?name=&page=";
const DETAIL_URL = "https://www.lawsociety.nu.ca/en/profile/";
const detailUrl = (id: string) => DETAIL_URL + id;

export async function index() {
  let page = 0;
  let has_more = true;
  let table_html = "";
  let table_rows = [];

  while (has_more) {
    console.log("page: ", page);
    const response = await fetch(INDEX_URL + page);
    const html = await response.text();
    const table = html.match(
      /<table class="views-table views-view-table cols-7">[\s\S]*?<\/table>/g
    );
    if (!table) {
      has_more = false;
      break;
    }
    if (page === 0) {
      // set table to the first table found
      table_html = table[0];
    }
    // only trs from inside tbody, NOT including trs inside thead and not including tbody itself
    const matches = table[0]
      .match(/<tbody>[\s\S]*?<\/tbody>/g)[0]
      .match(/<tr>[\s\S]*?<\/tr>/g);
    table_rows = table_rows.concat(matches);
    page++;
  }

  // append table_rows into tbody from table_html
  const tbody = table_html.match(/<tbody>[\s\S]*?<\/tbody>/g);
  if (!tbody) {
    console.log("no tbody found");
    return;
  }
  const new_tbody = tbody[0].replace(
    "</tbody>",
    table_rows.join("\n") + "</tbody>"
  );
  const new_table_html = table_html.replace(tbody[0], new_tbody);

  // get all the <a href="/en/profile/1828">Details</a> links from index and go to https://www.lawsociety.nu.ca
  const regex = /<a href="\/en\/profile\/(\d+)">Details<\/a>/g;
  const ids = [...new_table_html.matchAll(regex)].map((m) => m[1]);
  writeJSONFile(INDEX_FILE_PATH, { ids, timestamp: new Date().toISOString() });
  writeTextFile(INDEX_HTML_FILE_PATH, new_table_html);
}

export async function detail() {
    return getDetail(SITE, detailUrl)
}
