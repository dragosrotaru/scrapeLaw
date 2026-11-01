import { dataPath, getDetail } from "../../1-scrape/scrape.mts";
import { fetchSaveJSON } from "../../utility/io.mts";
import { Json } from "../../utility/types.mts";

/*
Endpoints: 
- https://az-ae-app-fal-prod-webservice.azurewebsites.net/api/practice/
- https://az-ae-app-fal-prod-webservice.azurewebsites.net/api/practice/31356/0
- https://az-ae-app-fal-prod-webservice.azurewebsites.net/api/mediator/
- https://az-ae-app-fal-prod-webservice.azurewebsites.net/api/mediator/7133
*/

export const SITE = "australia_nsw";
export const BASE_URL =
  "https://az-ae-app-fal-prod-webservice.azurewebsites.net/api/";

type Endpoint = "lawyer" | "practice" | "mediator";

type Index = {
  resultCount: number;
  results: Json[];
};

const PAGE_SIZE = 100000;

function indexFilePath(endpoint: Endpoint): string {
  return dataPath(SITE) + `${endpoint}/index.json`;
}
function formURL(endpoint: Endpoint, id?: string): string {
  const URL = BASE_URL + endpoint + "/";
  if (!id) return URL;
  return URL + endpoint === "practice" ? id.replace("_", "/") : id;
}

export async function index(endpoint: Endpoint): Promise<Index> {
  const index = await fetchSaveJSON(
    indexFilePath(endpoint),
    formURL(endpoint),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ page: 1, pageSize: PAGE_SIZE }),
    }
  );
  // todo validate schema
  if (index.results?.length === PAGE_SIZE) {
    throw new Error("Index is incomplete, PAGE_SIZE maxed out");
  }
  if (index.resultCount !== index.results?.length)
    throw new Error("resultCount does not match results length");
  if (index.resultCount === 0 || index.results?.length === 0)
    throw new Error("No results returned");
  return index;
}

export const detail = (endpoint: Endpoint) =>
  getDetail(
    SITE,
    (id: string) => formURL(endpoint, id),
    "json",
    (record) => (endpoint === "practice" ? record.compositeKey : record.id)
  );
