import { Option, program } from "commander";
import { prepare } from "./2-prepare/index.mts";
import { readTextFilesDir } from "./utility/io.mts";
import { detailPath } from "./1-scrape/scrape.mts";
import { represent } from "./3-represent/index.mts";

const cli = program
    .name("law-dataset")
    .version("0.0.1")
    .description("Scrape legal data");

const siteOption = new Option(
        "-s, --site <site>",
        "site to scrape"
    ).makeOptionMandatory();

const scrapeCMD = cli.command("scrape");
const prepareCMD = cli.command("prep");
const representCMD = cli.command("rep");
const extractCMD = cli.command("ext");

scrapeCMD
    .addOption(siteOption)
    .action(async ({ site }) => {
        console.log("scraping", site);

    });

prepareCMD
    .addOption(siteOption)
    .addOption(
        new Option("-l, --limit <limit>", "sample limit")
    )
    .action(async ({ site, limit }) => {
        console.log("preparing", site);
        const files = readTextFilesDir(detailPath(site));
        console.log(prepare(files, Number(limit)));
    });

representCMD
    .addOption(siteOption)
    .action(async ({ site }) => {
        console.log("representing", site);
        const files = readTextFilesDir(detailPath(site));
        const preparation = prepare(files);
        console.log(represent(preparation));
    });

extractCMD
    .addOption(siteOption)
    .action(async ({ site }) => {
        console.log("extracting", site);
    });

program.parse();