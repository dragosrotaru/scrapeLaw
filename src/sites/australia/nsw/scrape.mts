import fs from "fs";
import { fetchJSON, fetchSaveJSON, readJSONFile, writeJSONFile } from "../../../utility/io.mts";

/*
Endpoints: 
- https://az-ae-app-fal-prod-webservice.azurewebsites.net/api/practice/
- https://az-ae-app-fal-prod-webservice.azurewebsites.net/api/practice/31356/0
- https://az-ae-app-fal-prod-webservice.azurewebsites.net/api/mediator/
- https://az-ae-app-fal-prod-webservice.azurewebsites.net/api/mediator/7133
*/

const BASE_URL = "https://az-ae-app-fal-prod-webservice.azurewebsites.net/api/";
type Endpoint = "lawyer" | "practice" | "mediator";

function formURL(endpoint: Endpoint): string {
    return BASE_URL + endpoint + "/";
}

async function getIndex(endpoint: Endpoint) {
    await fetchSaveJSON(`index-${endpoint}.json`, formURL(endpoint), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ "page": 1, "pageSize":100000 }),
    })
}

async function getDetail(endpoint: Endpoint) {
    // Get Index
    const indexFileName = `index-${endpoint}.json`;
    const index = readJSONFile(indexFileName);
    const { resultCount, results } = index;
    console.log("count: ", resultCount);

    for (let i = 0; i < results.length; i++) {
        const item = results[i];

        const id = endpoint === "practice" ? item.compositeKey : item.id;

        console.log("index: ", i, " / ", results.length, " - ", id);
        
        const fileName = `detail-${endpoint}/${id}.json`
        
        // check if file exists
        if (fs.existsSync(fileName)) {
            console.log("exists, skipping ", id);
            continue;
        }

        const slug = endpoint === "practice" ? id.replace("_", "/") : id;

        // fetch and save
        await fetchSaveJSON(fileName, formURL(endpoint) + slug)
    }
}