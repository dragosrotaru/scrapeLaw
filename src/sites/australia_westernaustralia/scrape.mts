import { printProgress } from "../../1-scrape/print.mts";
import { CharacterIndex, CHARACTERS, getDetail, indexFilePath, PageIndex } from "../../1-scrape/scrape.mts";
import { fetchText, fileExists, readJSONFile, writeJSONFile } from "../../utility/io.mts";

const INDEX_URL = "https://www.lpbwa.org.au/practitioner-search";
const detailUrl = (id: string) => "https://www.lpbwa.org.au/" + id.replace(/_/g, "/");

const SITE = "australia_westernaustralia";
const INDEX_FILE_PATH = indexFilePath(SITE);

export async function index() {
    let index: CharacterIndex & PageIndex = {
        character: "a",
        page: 1,
        ids: [],
    }; // Default starting combo

    // Read the last completed combo from file if exists
    if (fileExists(INDEX_FILE_PATH)) {
        index = readJSONFile(INDEX_FILE_PATH);
    }

    console.log(index);
    
    let startIndex = CHARACTERS.indexOf(index.character[0]);
    const charLength = CHARACTERS.length;
    for (let i = startIndex; i < charLength; i++) {
        index.character = CHARACTERS[i];
        while (true) {
            const url = new URL(INDEX_URL);
            url.searchParams.set("searchtext", index.character);
            url.searchParams.set("page", index.page.toString());
            const html = await fetchText(url.toString());

            const hasResults = !html.includes("No matches found!");
            if (!hasResults) {
                index.page = 1;
                break;
            } 
            // <h3 class="clean"><a href="/alyx-lee-akroyd/829572"><i class="fa-solid fa-user"></i> Alyx Lee Akroyd</a></h3>
            // get hrefs and turn them info urls
            const results: string[] = [];
            const regex = /<h3 class="clean"><a href="\/([^"]+)">/g;
            let match;
            while ((match = regex.exec(html)) !== null) {
                results.push(match[1]);
            }

            index.ids.push(...results.map(result => result.replace(/\//g, "_")));
            
            printProgress(i, charLength, index.page.toString());
            index.page++;
            writeJSONFile(INDEX_FILE_PATH, index);
        }
    }
}

export async function detail() {
   return getDetail(SITE, detailUrl);
}
