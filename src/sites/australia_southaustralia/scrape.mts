// 3rd Party
import fs from "fs";
import puppeteer from "puppeteer";

// Global
import { ROOT_DATA_PATH } from "../../parameters.mts";

// This Step
import { indexByCharacter } from "../../1-scrape/scrape.mts";

const INDEX_URL = "https://www.lawsocietysa.asn.au/Public/Community/Register_Practising_Certificates.aspx";

const DATA_PATH = ROOT_DATA_PATH + "australia_southaustralia/";
const INDEX_FILE_PATH = DATA_PATH + "index.json";

export async function getIndex() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(INDEX_URL);

    indexByCharacter(INDEX_FILE_PATH, async (character) => {
        // search for character
        await page.$eval(".PanelFieldValue input", el => el.value = "");
        await page.type(".PanelFieldValue input", character);
        await page.click("input[type='submit']");
        await page.waitForNetworkIdle();

        let pageNum = 1;
        const rows_html: string[] = [];
        while (true) {
            // extract data
            rows_html.push(...await page.evaluate(() =>  Array.from(document.querySelectorAll('tr[valign]'), el => el.outerHTML)));
            
            console.log("page", pageNum, "total rows", rows_html.length);

            try {
                await page.click("input[title='Next Page']");
                await page.waitForNetworkIdle();
                pageNum++;
            } catch (error) {
                console.log("no more pages");
                break;
            }
        }
        return rows_html;
    });

    await browser.close();
}