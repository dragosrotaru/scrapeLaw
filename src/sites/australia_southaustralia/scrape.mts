// 3rd Party
import puppeteer from "puppeteer";

// This Step
import { indexByCharacter, indexFilePath } from "../../1-scrape/scrape.mts";

const INDEX_URL = "https://www.lawsocietysa.asn.au/Public/Community/Register_Practising_Certificates.aspx";

const SITE = "australia_southaustralia";
const INDEX_FILE_PATH = indexFilePath(SITE);

export async function index() {
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