import { ROOT_DATA_PATH } from "../parameters.mts";
import { fetchSaveJSON, fetchSaveText, fileExists, readJSONFile, writeJSONFile } from "../utility/io.mts";
import { JASON } from "../utility/types.mts";
import { printProgress } from "./print.mts";

export interface ScrapeIndex {
    timestamp: string;
    ids: string[];
}

export const CHARACTERS = "abcdefghijklmnopqrstuvwxyz";

export interface CharacterIndex {
    character: string;
    ids: string[];
}

export interface PageIndex {
    page: number;
    ids: string[];
}

export async function indexByCharacter(indexFilePath: string, operation: (character: string) => Promise<string[]>): Promise<void> {

    let index: CharacterIndex = {
        character: CHARACTERS[0],
        ids: [],
    }

    if (fileExists(indexFilePath)) {
        index = readJSONFile(indexFilePath);
    }

    const startIndex = CHARACTERS.indexOf(index.character);

    for (let i = startIndex; i < CHARACTERS.length; i++) {
        index.character = CHARACTERS[i];

        printProgress(i, CHARACTERS.length, index.character);

        // Extract data
        index.ids.push(...await operation(index.character));

        // Save data
        writeJSONFile(indexFilePath, index);
    }
}

export async function indexByPage(indexFilePath: string, operation: (page: number) => Promise<string[]>): Promise<void> {
    let index: PageIndex = {
        page: 0,
        ids: [],
    }

    if (fileExists(indexFilePath)) {
        index = readJSONFile(indexFilePath);
    }

    while (true) {
        printProgress(index.page, Infinity, "");

        // Extract data
        const results = await operation(index.page);

        // Save data
        index.ids.push(...results);
        writeJSONFile(indexFilePath, index);
        
        if (results.length === 0) break;

        index.page++;

    }
}

export const dataPath = (site: string) => ROOT_DATA_PATH + site + "/";
export const detailPath = (site: string) => dataPath(site) + "detail/";
export const detailFilePath = (site: string) => (type: "html" | "json") => (id: string) => detailPath(site) + id + "." + type;
export const indexFilePath = (site: string) => dataPath(site) + "index.json";
export const indexHTMLFilePath = (site: string) => dataPath(site) + "index.html";


export async function getDetail(site: string, detailUrl: (id: string) => string, type: "json" | "html" = "html", idLens?: (record: JASON) => string) {
    const { ids } = readJSONFile(indexFilePath(site));
    const count = ids.length;
    
    for (let i = 0; i < count; i++) {
        const id = idLens ? idLens(ids[i]) : ids[i];
        const fileName = detailFilePath(site)(type)(id);
        
        printProgress(i, count, id);
        
        if (fileExists(fileName)) {
            console.log('skipping', id);
            continue;
        }

        const fetchSave = type === "json" ? fetchSaveJSON : fetchSaveText;
        
        await fetchSave(fileName, detailUrl(id));
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
}