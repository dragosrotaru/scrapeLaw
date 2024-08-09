import { fileExists, readJSONFile, writeJSONFile } from "../utility/io.mts";
import { printProgress } from "./print.mts";

const CHARACTERS = "abcdefghijklmnopqrstuvwxyz";

interface CharacterIndex {
    character: string;
    results: string[];
}

interface PageIndex {
    page: number;
    results: string[];
}

export async function indexByCharacter(indexFilePath: string, operation: (character: string) => Promise<string[]>): Promise<void> {

    let index: CharacterIndex = {
        character: CHARACTERS[0],
        results: [],
    }

    if (fileExists(indexFilePath)) {
        index = readJSONFile(indexFilePath);
    }

    const startIndex = CHARACTERS.indexOf(index.character);

    for (let i = startIndex; i < CHARACTERS.length; i++) {
        index.character = CHARACTERS[i];

        printProgress(i, CHARACTERS.length, index.character);

        // Extract data
        index.results.push(...await operation(index.character));

        // Save data
        writeJSONFile(indexFilePath, index);
    }
}

export async function scrapeByPage(indexFilePath: string, operation: (page: number) => Promise<string[]>): Promise<void> {
    let index: PageIndex = {
        page: 0,
        results: [],
    }

    if (fileExists(indexFilePath)) {
        index = readJSONFile(indexFilePath);
    }

    while (true) {
        printProgress(index.page, Infinity, "");

        // Extract data
        const results = await operation(index.page);

        // Save data
        index.results.push(...results);
        writeJSONFile(indexFilePath, index);
        
        if (results.length === 0) break;

        index.page++;

    }
}