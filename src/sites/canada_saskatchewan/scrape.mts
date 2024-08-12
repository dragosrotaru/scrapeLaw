// Utility
import { fetchJSON, fetchSaveText, fileExists, readJSONFile } from "../../utility/io.mts";

// This Step
import { detailFilePath, indexByCharacter, indexFilePath } from "../../1-scrape/scrape.mts";

// https://lss.alinityapp.com/client/publicdirectory
// https://lss.alinityapp.com/Client/PublicDirectory/Registrant/440daace-43ce-ed11-bd6e-000c29b4f7fc
// same as new brunswick


const SITE = "canada_saskatchewan";
const INDEX_FILE_PATH = indexFilePath(SITE);

const INDEX_URL = "https://lss.alinityapp.com/client/PublicDirectory/Registrants";
const detailUrl = (id: string) => `https://lss.alinityapp.com/Client/PublicDirectory/Registrant/${id}`;

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
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10000 + 5000));
        return json.Records;
    });
}

export async function detail() {
    const { results } = readJSONFile(INDEX_FILE_PATH);
    const count = results.length;
    for (let i = 0; i < count; i++) {
        const { rg: id } = results[i];
        const filePath = detailFilePath(SITE)("html")(id);
        if (fileExists(filePath)) {
            console.log('skipping', id);
            continue;
        }
        await fetchSaveText(filePath, detailUrl(id));
        // await new Promise(resolve => setTimeout(resolve, Math.random() * 10000 + 1000));
    }
}