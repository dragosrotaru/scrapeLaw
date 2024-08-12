// Global
import { ROOT_DATA_PATH } from "../../parameters.mts";

// Utility
import { fetchSaveText, fileExists, readJSONFile } from "../../utility/io.mts";

// This Step
import { printProgress } from "../../1-scrape/print.mts";

// shows all on one page, includes email website and all the goodies

const DATA_PATH = ROOT_DATA_PATH + "canada_novascotia/";
const INDEX_FILE_PATH = DATA_PATH + "index.json";
const INDEX_HTML_FILE_PATH = DATA_PATH + "index.json";
const getDetailFilePath = (id: string) => DATA_PATH + "detail/" + id + ".html";


const BASE_URL = "https://members.nsbs.org/NSBSWEB/Lawyer_Search/";
export const INDEX_URL = BASE_URL + "Search_Page.aspx";
export const DETAIL_URL = BASE_URL + "Results_Page2.aspx?ID=";

const getDetailUrl = (id: string) => DETAIL_URL + id;


export async function getIndex() {
    // todo
    // get every <a title="View Details" href="/NSBSWEB/Lawyer_Search/Results_Page2.aspx?ID=103792"> from index file and download the page
    const index = "";
    const regex = /<a title="View Details" href="([^"]+)">/g;
    const ids = [...index.matchAll(regex)].map((a) => a[1].split("=")[1]);
}


export async function getDetail() {
    const ids = readJSONFile(INDEX_FILE_PATH);
    const count = ids.length;

    for (let i = 0; i < count; i++) {
        const id = ids[i];
        printProgress(i, count, id);
        const fileName = getDetailFilePath(id);

        // check if file exists
        if (fileExists(fileName)) {
            console.log("exists, skipping ", id);
            continue;
        }
        await fetchSaveText(fileName, getDetailUrl(id));
        await new Promise((resolve) => setTimeout(resolve, 50)); // delay
    }
}