import { Option, program } from "commander";

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
    .action(async ({ site }) => {
        console.log("preparing", site);

    });

representCMD
    .addOption(siteOption)
    .action(async ({ site }) => {
        console.log("representing", site);

    });

extractCMD
    .addOption(siteOption)
    .action(async ({ site }) => {
        console.log("extracting", site);
    });

program.parse();