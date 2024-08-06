import { fetchJSON, fetchSaveJSON, writeJSONFile } from "../../../utility/io.mts";

// https://find-a-barrister.nswbar.asn.au
export async function getIndex() {
    const url = "https://fab-api.nswbar.asn.au/fab/api/barristers?text=&currPage=1&limit=10000&yearRange=0,57&expType=noPref&gender=noPref&silk=noPref&crownProsecutor=noPref&interstate=noPref&sort=surname&sortOrder=1";
    await fetchSaveJSON("index-barrister.json", url);
}
