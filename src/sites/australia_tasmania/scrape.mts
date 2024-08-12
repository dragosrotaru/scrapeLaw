// Global
import { indexFilePath } from "../../1-scrape/scrape.mts";

// Utility
import { readJSONFile, writeJSONFile } from "../../utility/io.mts";

// https://www.lst.org.au/find-a-lawyer/
// https://web-tempusis.formtitan.com/formField/fillIntegration
// POSTS to second link which returns data in json format

// https://www.lst.org.au/law-firm-details/?fld31=0015g00000GLK9IAAX
// https://www.lst.org.au/lawyer-details/?fld47=a069q000000Zbi0
// same as index, better to capture second link

const SITE = "australia_tasmania";
const INDEX_FILE_PATH = indexFilePath(SITE);

function processFirms() {
    const { data } = readJSONFile(INDEX_FILE_PATH);
    const names = data["tablel#-#1625640510964-870-130#-#1625640510964-894-131#-#1625640510964-92-01"];
    const ids = data["tablel#-#1625640510964-870-130#-#RecordID#-#1625640510964-92-01"];
    const hash = data["tablel#-#1625640510964-870-130#-#RecordHash#-#1625640510964-92-01"];
    const address = data["tablel#-#1625640510964-870-130#-#1625640510964-482-1#-#1625640510964-92-01"];
    const locale = data["tablel#-#1625640510964-870-130#-#1625640510964-586-2#-#1625640510964-92-01"];
    const type = data["tablel#-#1625640510964-870-130#-#1625640539543-216-1#-#1625640510964-92-01"];
    const phone = data["tablel#-#1625640510964-870-130#-#1625640559692-88-2#-#1625640510964-92-01"];
    const region = data["tablel#-#1625640510964-870-130#-#1625640564334-261-3#-#1625640510964-92-01"];
    const detail_link = data["tablel#-#1625640510964-870-130#-#1625640572691-131-4#-#1625640510964-92-01"];

    return names.map((name, i) => ({
        name,
        id: ids[i],
        hash: hash[i],
        address: address[i],
        locale: locale[i],
        type: type[i],
        phone: phone[i],
        region: region[i],
        detail_link: detail_link[i]
    }));
}

function processIndividuals() {
    const { data } = readJSONFile(INDEX_FILE_PATH);
    const names = data["tablel#-#1625702197441-495-132#-#1625702197441-39-132#-#1625640510964-92-01"];
    const ids = data["tablel#-#1625702197441-495-132#-#RecordID#-#1625640510964-92-01"];
    const hash = data["tablel#-#1625702197441-495-132#-#RecordHash#-#1625640510964-92-01"];
    const date_of_admission = data["tablel#-#1625702197441-495-132#-#1625702197441-658-1#-#1625640510964-92-01"];
    const pc_issued_date = data["tablel#-#1625702197441-495-132#-#1625702197441-617-2#-#1625640510964-92-01"];
    const type = data["tablel#-#1625702197441-495-132#-#1625702197441-608-3#-#1625640510964-92-01"];
    const firm = data["tablel#-#1625702197441-495-132#-#1625702197441-412-4#-#1625640510964-92-01"];
    const detail_link = data["tablel#-#1625702197441-495-132#-#1625702197441-387-6#-#1625640510964-92-01"];
    return names.map((name, i) => ({
        name,
        id: ids[i],
        hash: hash[i],
        date_of_admission: date_of_admission[i],
        pc_issued_date: pc_issued_date[i],
        type: type[i],
        firm: firm[i],
        detail_link: detail_link[i]
    }));
}

export async function processIndex() {
    const firms = processFirms();
    const individuals = processIndividuals();
    writeJSONFile("firms.json", firms);
    writeJSONFile("individuals.json", individuals);
}