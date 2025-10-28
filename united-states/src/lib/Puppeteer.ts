import puppeteer from "puppeteer";

import { Browser } from "puppeteer";

class Puppeteer {
    static browser: Browser | null = null;
    static async getInstance() {
        if (!Puppeteer.browser) {
            Puppeteer.browser = await puppeteer.launch({ 
                headless: false,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
        return Puppeteer.browser;
    }

    static async close() {
        if (Puppeteer.browser) {
            await Puppeteer.browser.close();
            Puppeteer.browser = null;
        }
    }
}

export default Puppeteer;