// Utility
import { fetchSaveJSON } from "../../utility/io.mts";

// This Step
import { indexFilePath } from "../../1-scrape/scrape.mts";

export const UI_URL = "https://find-a-barrister.nswbar.asn.au";
export const INDEX_URL = "https://fab-api.nswbar.asn.au/fab/api/barristers?text=&currPage=1&limit=10000&yearRange=0,57&expType=noPref&gender=noPref&silk=noPref&crownProsecutor=noPref&interstate=noPref&sort=surname&sortOrder=1";

export const SITE = "australia_nsw_barrister";
export const INDEX_FILE_PATH = indexFilePath(SITE);

export async function index() {
  return await fetchSaveJSON(INDEX_FILE_PATH, INDEX_URL);
}
