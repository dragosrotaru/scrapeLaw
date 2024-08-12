import { ROOT_DATA_PATH } from "../parameters.mts";
import { fetchSaveText, fileExists, readJSONFile, writeJSONFile } from "../utility/io.mts";
import { printProgress } from "./print.mts";

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

export const detailFilePath = (site: string) => (id: string) => dataPath(site) + "detail/" + id + ".html";
export const indexFilePath = (site: string) => dataPath(site) + "index.json";


export async function getDetail(site: string, detailUrl: (id: string) => string) {
    const { ids } = readJSONFile(indexFilePath(site));
    const count = ids.length;
    
    for (let i = 0; i < count; i++) {
        const id = ids[i];
        const fileName = detailFilePath(site)(id);
        
        printProgress(i, count, id);
        
        if (fileExists(fileName)) {
            console.log('skipping', id);
            continue;
        }
        
        await fetchSaveText(fileName, detailUrl(id));
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
}