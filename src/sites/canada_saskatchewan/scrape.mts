// Utility
import { fetchJSON } from "../../utility/io.mts";

// This Step
import { getDetail, indexByCharacter, indexFilePath } from "../../1-scrape/scrape.mts";

// https://lss.alinityapp.com/client/publicdirectory
// same as new brunswick


const SITE = "canada_saskatchewan";
const INDEX_FILE_PATH = indexFilePath(SITE);

const BASE_URL = "https://lss.alinityapp.com/client/PublicDirectory/";
const INDEX_URL = BASE_URL + "Registrants";
const detailUrl = (id: string) => BASE_URL + `Registrant/${id}`;

export async function index() {
    return indexByCharacter(INDEX_FILE_PATH, async (character) => {
        const body = new FormData();
        body.append("querySID", "1000601");
        body.append(
            "queryParameters",
            JSON.stringify({
            Parameter: [
                { ID: "TextOptionA", Value: character, ValueLabel: "[not+entered]" },
                { ID: "TextOptionD", Value: "", ValueLabel: "[not+entered]" },
                { ID: "SpecializationSID", Value: "-", ValueLabel: "[not+entered]" },
                { ID: "ExperienceRange", Value: "-", ValueLabel: "[not+entered]" },
                { ID: "TextOptionB", Value: "", ValueLabel: "[not+entered]" },
                { ID: "TextOptionC", Value: "", ValueLabel: "[not+entered]" },
                { ID: "ServiceModels", Value: "-", ValueLabel: "[not+entered]" },
                { ID: "GenderPronoun", Value: "-", ValueLabel: "[not+entered]" },
                { ID: "TextOptionE", Value: "", ValueLabel: "[not+entered]" },
                { ID: "PricingModels", Value: "-", ValueLabel: "[not+entered]" },
            ],
            })
        );
        const json = await fetchJSON(INDEX_URL, {
            method: "POST",
            body,
          });
        // todo factor out
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10000 + 5000));
        return json.Records;
    });
}

export async function detail() {
    return getDetail(SITE, detailUrl, "html", (record) => record.rg);
}