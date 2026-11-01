import { JSDOM } from "jsdom";
import Puppeteer from "../../lib/Puppeteer";
import { delay, randomDelay } from "../../lib/utils";
import { Browser } from "puppeteer";
import { profileExists, readIndex, saveProfile } from "../../lib/storage";
import { REGION } from "./region";

type LawyerProfile = {
  barNumber: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  memberStatus: string;
  eligibilityStatus: string;
  personalBarUrl: string;
  county: string;
  circuit: string;
  admittedDate: string;
  disciplineHistory: string;
  languages: string[];
  firmName: string;
  firmPosition: string;
  firmWebsite: string;
};

const composeProfileUrl = (barNumber: string) =>
  `

https://www.floridabar.org/mybarprofile/${barNumber}`;

const fetchProfilePage = async (barNumber: string) => {
  const url = composeProfileUrl(barNumber);
  const response = await fetch(url);
  const html = await response.text();
  return html;
};

const puppeteerFetchProfilePage = async (barNumber: string, browser: Browser) => {
  const page = await browser.newPage();
  await page.goto(composeProfileUrl(barNumber));
  const html = await page.content();
  await page.close();
  return html;
};

/**
 * Parse the profile page of a lawyer in the Florida Bar directory and return the data
 * available on the page.
 *
 * @param html - The HTML of the profile page
 * @returns A lawyer profile
 */
const parseProfilePage = (html: string): LawyerProfile => {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Helper function to get text content from a labeled field
  const getLabeledContent = (label: string): string => {
    const labelElement = Array.from(document.querySelectorAll("label")).find(
      (el: Element) => el.textContent?.includes(label)
    );
    if (!labelElement) return "";
    const row = labelElement.closest(".row") as HTMLElement;
    if (!row) return "";
    const content = row.querySelector("p");
    return content ? content.textContent?.trim() || "" : "";
  };

  // Extract name
  const nameElement = document.querySelector("h1.full");
  const name = nameElement ? nameElement.textContent?.trim() || "" : "";

  // Extract member status and eligibility
  const memberStatusElement = document.querySelector(".member-status");
  const memberStatus = memberStatusElement
    ? memberStatusElement.textContent?.trim() || ""
    : "";

  const eligibilityElement = document.querySelector(".eligibility");
  const eligibilityStatus = eligibilityElement
    ? eligibilityElement.textContent?.trim() || ""
    : "";

  // Extract address
  const addressRow = Array.from(document.querySelectorAll("label"))
    .find((el: Element) => el.textContent?.includes("Mail Address:"))
    ?.closest(".row") as HTMLElement | null;
  const addressElement = addressRow?.querySelector("p");
  const address = addressElement
    ? addressElement.innerHTML
        .replace(/<br\s*\/?>/g, "\n")
        .replace(/<[^>]+>/g, "")
        .trim()
    : "";

  // Extract phone
  const phoneElement = addressRow?.querySelector('a[href^="tel:"]');
  const phone = phoneElement
    ? phoneElement.getAttribute("href")?.replace("tel:", "") || ""
    : "";

  // Extract email
  const emailElement = document.querySelector('a[href^="mailto:"]');
  const email = emailElement
    ? emailElement.getAttribute("href")?.replace("mailto:", "") || ""
    : "";

  // Extract other labeled fields
  const barNumber = getLabeledContent("Bar Number:");
  const personalBarUrl = getLabeledContent("Personal Bar URL:");
  const county = getLabeledContent("County:");
  const circuit = getLabeledContent("Circuit:");
  const admittedDate = getLabeledContent("Admitted:");
  const disciplineHistory = getLabeledContent("10-Year Discipline History:");
  const firmName = getLabeledContent("Firm:");
  const firmPosition = getLabeledContent("Firm Position:");

  // Extract firm website
  const firmWebsiteElement = document.querySelector('a[class="icon-external"]');
  const firmWebsite = firmWebsiteElement
    ? firmWebsiteElement.textContent?.trim() || ""
    : "";

  // Extract languages
  const languagesRow = Array.from(document.querySelectorAll("label"))
    .find((el: Element) => el.textContent?.includes("Languages:"))
    ?.closest(".row") as HTMLElement | null;
  const languageElements = languagesRow?.querySelectorAll("p");
  const languages = languageElements
    ? Array.from(languageElements).map(
        (el: Element) => el.textContent?.trim() || ""
      )
    : [];

  return {
    barNumber,
    name,
    address,
    phone,
    email,
    memberStatus,
    eligibilityStatus,
    personalBarUrl,
    county,
    circuit,
    admittedDate,
    disciplineHistory,
    languages,
    firmName,
    firmPosition,
    firmWebsite,
  };
};

export const profiles = async (withPuppeteer: boolean = true) => {
  const index = readIndex(REGION);

  const browser = await Puppeteer.getInstance();
  // delay loop over bar numbers
  for (const barNumber of index) {

    // check if file exists
    if (profileExists(REGION, barNumber, "html")) {
      console.log(`Skipping ${barNumber} because it already exists`);
      continue;
    }
    
    await randomDelay(1000, 10000);
    const html = withPuppeteer
      ? await puppeteerFetchProfilePage(barNumber, browser)
      : await fetchProfilePage(barNumber);
    const profile = parseProfilePage(html);
    console.log(`Downloaded profile for ${profile.name} (${barNumber})`);

    if (profile.name === "") {
        console.error("Scraper stopped because of empty name");
        await delay(100000);
        continue;
    }
    // write html to file
    saveProfile(REGION, barNumber, html, "html");
    // write profile to file
    saveProfile(REGION, barNumber, profile, "json");
  }

  await Puppeteer.close();
};
