import fs from "fs";
import { fetchText, fileExists, readJSONFile, writeJSONFile, writeTextFile } from "../../utility/io.mts";
import { detailFilePath, indexFilePath, PageIndex } from "../../1-scrape/scrape.mts";
import { printProgress } from "../../1-scrape/print.mts";

const BASE_URL = "https://www.barreau.qc.ca/en/find-a-lawyer/";
const INDEX_URL = BASE_URL + "results/?p="
const DETAIL_URL = BASE_URL + "member/?id="

const SITE = "canada_quebec";
const INDEX_FILE_PATH = indexFilePath(SITE);

export async function index() {
    let index: PageIndex & { totalPages: number } = fileExists(INDEX_FILE_PATH) ? readJSONFile(INDEX_FILE_PATH) : {
        page: 1,
        totalPages: 1,
        ids: [],
        timestamp: new Date().toISOString(),
    }
    
    for (let i = index.page; i <= index.totalPages; i++) {
        const html = await fetchText(INDEX_URL + i);

        const num_results = html.match(/<p class="mb-0 h-8 text-p3 font-medium px-4 leading-normal">\s+(\d+) results/);
        if (!num_results) {
            console.log('no results found');
            continue;
        }
        index.totalPages = Math.ceil(Number(num_results[1]) / 25);

        const table_body = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/);
        if (!table_body) {
            console.log('no table body found');
            continue;
        }
    
        const rows = table_body[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/g);
        if (!rows) {
            console.log('no rows found');
            continue;
        }
        // extract id href="/en/find-a-lawyer/member/?id=caa148469da2840a26276b20f2220ca61d9334019abd255a575f32b99a12cd37&amp;backUrl=%2Fen%2Ffind-a-lawyer%2Fresults%2F%3Fp%3D1"
        const ids = rows
            .filter(row => row.includes("/en/find-a-lawyer/member/?id="))
            .map(row => row.match(/id=([^&]+)/)![1]);
        
        index.page = i;
        index.ids = index.ids.concat(rows);
        printProgress(i, index.totalPages, ids.length.toString());

        writeJSONFile(INDEX_FILE_PATH, index);
    }
}

export async function detail() {
    const { ids } = JSON.parse(fs.readFileSync("index.json", "utf8"));
    const count = ids.length;
    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const fileName = detailFilePath(SITE)("html")(id);
        printProgress(i, count, id);

        if (fileExists(fileName)) {
            console.log("skipping", id);
            continue;
        }

        const html = await fetchText(DETAIL_URL + id);

        if (html.includes("Security measure") || html.includes("You have reached the limit of requests allowed daily")) {
            console.log(`id ${id} ${i} of ${ids.length} captcha or limit`);
            throw new Error("captcha or limit");
        }

        writeTextFile(fileName, html);
    }
}