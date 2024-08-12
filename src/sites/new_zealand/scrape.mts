import { fileExists, readJSONFile, writeJSONFile } from "../../utility/io.mts";
import { dataPath, getDetail, indexFilePath } from "../../1-scrape/scrape.mts";

const SITE = "new_zealand";
const INDEX_FILE_PATH = indexFilePath(SITE);

const index_url = "https://www.lawsociety.org.nz/for-the-public/find-a-lawyer/?sort=&direction=asc&PracticeAreas=&Specialisation=&Regions=&RegulatoryCertificateTypes=&Languages=&sort_proximity=2012&page=2&page_size=1000&Keyword=";

const DETAIL_URL = "https://www.lawsociety.org.nz/register/";
const detailUrl = (id: string) => DETAIL_URL + id + "/";

// about 16,401 practicing certificate lawyers, but the results max out at 10000.

export async function getIndex() {
    let index = {
        character: "a",
        page: 2,
        ids: [],
    };

    if (fileExists(INDEX_FILE_PATH)) {
        index = readJSONFile(INDEX_FILE_PATH);
    }

    const characters = 'abcdefghijklmnopqrstuvwxyz';

    const startIndex = characters.indexOf(index.character);
    for (let i = startIndex; i < characters.length; i++) {
        index.character = characters[i];

        const url = new URL(index_url);
        url.searchParams.set('Keyword', index.character);

        index.page = 2;
        while (true) {
            url.searchParams.set('page', index.page.toString());
            const response = await fetch(url);
            const text = await response.text();

            // extract all ids in the form href="/register/ian-stewart-avison/?glh=1"
            const match = text.match(/\/register\/([^\/]+)\/\?/g);

            if (!match) {
                break;
            }
            const ids = match.map(m => m.match(/\/register\/([^\/]+)\/\?/)[1]);
            const uniques = ids.filter(id => !index.results.includes(id));

            console.log('char:', index.character, 'page:', index.page, 'ids:', ids.length, 'uniques:', uniques.length);

            // add non-duplicates to results
            index.ids.push(...uniques);

            // save index
            writeJSONFile(INDEX_FILE_PATH, index);
            index.page++;
        }
        
    }
}

export async function getDetails() {
    return getDetail(SITE, detailUrl);
}