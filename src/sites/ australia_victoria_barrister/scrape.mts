process.env.NODE_OPTIONS = "--no-deprecation";

import { JSDOM } from "jsdom";
import { ROOT_DATA_PATH } from "../../parameters.mts";
import { scrapeByPage } from "../../1-scrape/scrape.mts";
import { fetchSaveText, fetchText, readJSONFile } from "../../utility/io.mts";
import { printProgress } from "../../1-scrape/print.mts";

const INDEX_URL = "https://www.vicbar.com.au/find-barrister?term=&signed_bar_roll=All&qualifications=&keywords=&silk_or_junior=All&accredited_mediator=All&directbriefs=All&adv_accredited_mediator=All&directaccess=All&arbitration=All&gender=All&icc_accreditation=All&pss=All&items_per_page=200&sort_bef_combine=field_seniority_sort_order+ASC&page=1";
const detailUrl = (id: string) =>  "https://www.vicbar.com.au/profile/" + id;

const DATA_PATH = ROOT_DATA_PATH + "australia_victoria_barrister/";
const INDEX_FILE_PATH = DATA_PATH + "index.json";
const detailFilePath = (id: string) => DATA_PATH + "detail/" + id + ".html";

export async function getIndex() {
    return scrapeByPage(INDEX_FILE_PATH, async (page: number) => {
        // get page html
        const url = new URL(INDEX_URL);
        url.searchParams.set("page", page.toString());
        const html = await fetchText(url.toString());

        const results: string[] = [];
        
        // handle no results
        const no_results = html.includes("No Result Found");
        if (no_results) {
            console.log(`page ${page} no results`);
            return results;
        }

        // Grab html
        const query = new JSDOM(html).window.document.querySelectorAll(".user-profile");
        query.forEach((el) => results.push(el.outerHTML));
        
        console.log(`page ${page} results ${results.length}`);
        return results;
    });
}

export async function getDetail() {
    const { results } = readJSONFile(INDEX_FILE_PATH);
    const ids = results.map(b => b.match(/about="\/profile\/(\d+)"/)[1])
    const count = ids.length;
    for (let i = 0; i < count; i++) {
        const id = ids[i];
        printProgress(i, count, id);
        await fetchSaveText(detailFilePath(id), detailUrl(id));
    }
}