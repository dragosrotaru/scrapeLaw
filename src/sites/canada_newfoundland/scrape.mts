import fs from "fs";
import { fetchSaveText, fileExists, readJSONFile, writeJSONFile } from "../../utility/io.mts";
import { printProgress } from "../../1-scrape/print.mts";
import { ROOT_DATA_PATH } from "../../parameters.mts";
import { detailFilePath } from "../../1-scrape/scrape.mts";

const DATA_PATH = ROOT_DATA_PATH + "canada_newfoundland/";
const INDEX_FILE_PATH = DATA_PATH + "index.json";
const INDEX_HTML_FILE_PATH = DATA_PATH + "index.html";

const BASE_URL = "https://lsnl.memberpro.net/main/body.cfm";
const INDEX_URL = BASE_URL + "?menu=directory&submenu=directoryPractisingMember";
const DETAIL_URL = INDEX_URL;

// same system as alberta

export async function getIndex() {
    /*
    takes a while to receive the response but it does give the entire database
    in one go if you include a single space in the person name field
    */
    const body = new FormData();
    body.append("person_nm", " ");
    body.append("first_nm", "");
    body.append("location_nm", "");
    body.append("mode", "search");

    const html = await fetchSaveText(INDEX_HTML_FILE_PATH, INDEX_URL, {
        method: "POST",
        body,
    });

    // <TR> <TD CLASS="table-result"> <A HREF=https://lsnl.memberpro.net/main/body.cfm?menu=directory&submenu=directoryPractisingMember&mode=search&searchField=location_nm&search_value=&record_id=30&table_id=11870

    // match all the record_id and table_id
    const regex = /search_value=&record_id=(\d+)&table_id=(\d+)/g;
    const index = [...html.matchAll(regex)].map((a) => a.slice(1));    
    writeJSONFile(INDEX_FILE_PATH, index);
}

export async function getDetail() {
    const index = readJSONFile(INDEX_FILE_PATH);
    const count = index.length;

    // todo double check this grab exactly all results, and no results are missed

    for (let i = 0; i < count; i++) {
        const [record_id, table_id] = index[i]; // table id is the actual ID, record is just incremental
        printProgress(i, count, table_id);

        const fileName = detailFilePath(DATA_PATH)(table_id);

        // check if file exists
        if (fileExists(fileName)) {
            console.log("exists, skipping ", table_id);
            continue;
        }

        const body = new FormData();
        body.append("menu", "directory");
        body.append("submenu", "directoryPractisingMember");
        body.append("mode", "search");
        body.append("searchField", "location_nm");
        body.append("search_value", "");
        body.append("record_id", record_id);
        body.append("table_id", table_id);

        await fetchSaveText(fileName, DETAIL_URL, {
            method: "POST",
            body,
        });
        await new Promise((resolve) => setTimeout(resolve, 50)); // delay 
    }
}