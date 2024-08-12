import { printProgress } from "../../1-scrape/print.mts";
import { detailFilePath } from "../../1-scrape/scrape.mts";
import { ROOT_DATA_PATH } from "../../parameters.mts";
import { fetchSaveText, fileExists, readJSONFile, writeJSONFile, writeTextFile } from "../../utility/io.mts";


const DATA_PATH = ROOT_DATA_PATH + "canada_nunavut/";
const INDEX_FILE_PATH = DATA_PATH + "index.json";
const INDEX_HTML_FILE_PATH = DATA_PATH + "index.html";

const INDEX_URL = "https://www.lawsociety.nu.ca/en/for-the-public/membership-directory?name=&page=";
const DETAIL_URL = "https://www.lawsociety.nu.ca/en/profile/";
const detailUrl = (id: string) => DETAIL_URL + id;

export async function getIndex() {    
    let page = 0;
    let has_more = true;
    let table_html = "";
    let table_rows = [];

    while (has_more) {
        console.log("page: ", page);
        const response = await fetch(INDEX_URL + page);
        const html = await response.text();
        const table = html.match(/<table class="views-table views-view-table cols-7">[\s\S]*?<\/table>/g);
        if (!table) {
            has_more = false;
            break;
        }
        if (page === 0) {
            // set table to the first table found
            table_html = table[0];
        }
        // only trs from inside tbody, NOT including trs inside thead and not including tbody itself 
        const matches = table[0].match(/<tbody>[\s\S]*?<\/tbody>/g)[0].match(/<tr>[\s\S]*?<\/tr>/g);
        table_rows = table_rows.concat(matches);
        page++;
    }

    // append table_rows into tbody from table_html
    const tbody = table_html.match(/<tbody>[\s\S]*?<\/tbody>/g);
    if (!tbody) {
        console.log("no tbody found");
        return;
    }
    const new_tbody = tbody[0].replace("</tbody>", table_rows.join("\n") + "</tbody>");
    const new_table_html = table_html.replace(tbody[0], new_tbody);

    // get all the <a href="/en/profile/1828">Details</a> links from index and go to https://www.lawsociety.nu.ca
    const regex = /<a href="\/en\/profile\/(\d+)">Details<\/a>/g;
    const ids = [...new_table_html.matchAll(regex)].map(m => m[1]);
    writeJSONFile(INDEX_FILE_PATH, ids);
    writeTextFile(INDEX_HTML_FILE_PATH, new_table_html);
}

export async function getDetail() {
    const ids = readJSONFile(INDEX_FILE_PATH);
    const count = ids.length;
    
    for (let i = 0; i < count; i++) {
        const id = ids[i];
        printProgress(i, count, id);
        const fileName = detailFilePath(DATA_PATH)(id);

        // check if file exists
        if (fileExists(fileName)) {
            console.log("exists, skipping ", id);
            continue;
        }

        fetchSaveText(fileName, detailUrl(id));
        await new Promise((resolve) => setTimeout(resolve, 50)); // delay
    }
}