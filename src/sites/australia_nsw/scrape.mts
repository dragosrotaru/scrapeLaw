import { printProgress } from "../../1-scrape/print.mts";
import { ROOT_DATA_PATH } from "../../parameters.mts";
import { fetchSaveJSON, fileExists, readJSONFile } from "../../utility/io.mts";
import { JASON } from "../../utility/types.mts";

/*
Endpoints: 
- https://az-ae-app-fal-prod-webservice.azurewebsites.net/api/practice/
- https://az-ae-app-fal-prod-webservice.azurewebsites.net/api/practice/31356/0
- https://az-ae-app-fal-prod-webservice.azurewebsites.net/api/mediator/
- https://az-ae-app-fal-prod-webservice.azurewebsites.net/api/mediator/7133
*/

export const DATA_PATH = ROOT_DATA_PATH + "australia_nsw/";
export const BASE_URL = "https://az-ae-app-fal-prod-webservice.azurewebsites.net/api/";
type Endpoint = "lawyer" | "practice" | "mediator";


type Index = {
    resultCount: number;
    results: JASON[];
}

const PAGE_SIZE = 100000;

function indexFilePath(endpoint: Endpoint): string {
    return DATA_PATH +`${endpoint}/index.json`;
}
function detailFilePath(endpoint: Endpoint, id: string): string {
    return DATA_PATH + `${endpoint}/detail/${id}.json`;
}

function formURL(endpoint: Endpoint): string {
    return BASE_URL + endpoint + "/";
}

export async function getIndex(endpoint: Endpoint): Promise<Index> {
    const index = await fetchSaveJSON(indexFilePath(endpoint), formURL(endpoint), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ "page": 1, "pageSize": PAGE_SIZE }),
    });
    // todo validate schema
    if (index.results?.length === PAGE_SIZE) {
        throw new Error("Index is incomplete, PAGE_SIZE maxed out");
    }
    if (index.resultCount !== index.results?.length) throw new Error("resultCount does not match results length");
    if (index.resultCount === 0 || index.results?.length === 0) throw new Error("No results returned");
    return index;
}

export async function getDetail(endpoint: Endpoint) {
    // Get Index
    const indexFileName = indexFilePath(endpoint);
    const index = readJSONFile(indexFileName);
    const { results } = index;
    const count = results.length;
    console.log("count: ", count);

    for (let i = 0; i < count; i++) {
        const item = results[i];

        const id = endpoint === "practice" ? item.compositeKey : item.id;

        printProgress(i, count, id);
        
        const filePath = detailFilePath(endpoint, id);
        
        // check if file exists
        if (fileExists(filePath)) {
            console.log("exists, skipping ", id);
            continue;
        }

        const slug = endpoint === "practice" ? id.replace("_", "/") : id;

        // fetch and save
        await fetchSaveJSON(filePath, formURL(endpoint) + slug)
    }
}