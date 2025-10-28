import { delay } from "../../lib/utils";
import { profileExists, saveProfile } from "../../lib/storage";
import { JSDOM } from 'jsdom';
import { REGION } from "./region";

const FIRST_CONTACT_ID = 148187;

const composeProfileUrl = (contactID: number) =>
    `https://www.texasbar.com/AM/Template.cfm?Section=Find_A_Lawyer&template=/Customsource/MemberDirectory/MemberDirectoryDetail.cfm&ContactID=${contactID}`;

const fetchProfilePage = async (url: string) => {
    const response = await fetch(url);
    return await response.text();
};

interface TexasBarProfile {
    name: {
        prefix?: string;
        firstName?: string;
        middleName?: string;
        lastName?: string;
        suffix?: string;
    };
    bar: {
        number?: string;
        dateOfAdmission?: string;
        status?: string;
        statutoryProfileLastCertified?: string;
    };
    location: {
        primary?: string;
        address?: string;
    },
    firm: {
        name?: string;
        size?: string;
        occupation?: string;
        areasOfPractice?: string[];
    },
    contact: {
        phone?: string;
        website?: string;
        email?: boolean;
        socialMediaLinks: string[];
    };
    education: Array<{
        school: string;
        degree?: string;
        graduationDate?: string;
    }>;
    courtAdmissions: {
        federal?: string[];
        otherCourts?: string[];
        otherStates?: string[];
    };
    recognition?: {
        boardCertifications: string[];
        other: string[];
    };
}

const parseProfilePage = (html: string): TexasBarProfile => {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const xPathResult = dom.window.XPathResult;
    
    const profile: TexasBarProfile = {
        name: {},
        bar: {},
        location: {},
        firm: {},
        contact: {
            socialMediaLinks: []
        },
        education: [],
        courtAdmissions: {}
    };

    
    const basicInfoCard = document.querySelector('#hcard-Lawyer-L-Name');
    if (basicInfoCard) {
        // Parse name
        profile.name.prefix = basicInfoCard.querySelector('.honorific-prefix')?.textContent?.trim();
        profile.name.firstName = basicInfoCard.querySelector('.given-name')?.textContent?.trim();
        profile.name.middleName = basicInfoCard.querySelector('.additional-name')?.textContent?.trim();
        profile.name.lastName = basicInfoCard.querySelector('.family-name')?.textContent?.trim();
        profile.name.suffix = basicInfoCard.querySelector('.honorific-suffix')?.textContent?.trim();

    }
    // Bar Status
    profile.bar.status = document.querySelector('#hcard-Lawyer-L-Name .status-text')?.textContent?.replace(/\s+/g, ' ').trim();
    
    // Bar Card Number
    const barCardText = document.evaluate("//strong[contains(text(), 'Bar Card Number:')]", document, null, xPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element;
    if (barCardText?.parentElement) {
        const barInfoText = barCardText.parentElement.textContent?.trim() || '';
        const barNumber = barInfoText.match(/Bar Card Number:\s*(\d+)/)?.[1];
        if (barNumber) {
            profile.bar.number = barNumber;
        }
    }

    // TX license date
    const licenseText = document.evaluate("//strong[contains(text(), 'TX License Date:')]", document, null, xPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element;
    if (licenseText?.parentElement) {
        const licenseInfoText = licenseText.parentElement.textContent?.trim() || '';
        const licenseDate = licenseInfoText.match(/TX License Date:\s*([^:]+?)(?:\s*$|\s*:)/)?.[1];
        if (licenseDate) {
            profile.bar.dateOfAdmission = licenseDate.trim();
        }
    }

    // Primary Practice Location
    const primaryPracticeLocation = document.evaluate("//strong[contains(text(), 'Primary Practice Location:')]", document, null, xPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element;
    if (primaryPracticeLocation?.parentElement) {
        profile.location.primary = primaryPracticeLocation.parentElement.textContent?.split(':')[1]?.trim();
    }

    // Address
    const addressBlock = document.querySelector('#hcard-Lawyer-L-Name .address .value-block');
    if (addressBlock) {
        profile.location.address = addressBlock.textContent?.replace(/\s+/g, ' ').trim();
    }


    // Practice Areas
    const practiceAreas = document.querySelector('#hcard-Lawyer-L-Name .areas')?.textContent?.replace("Practice Areas:", "").trim();
    if (practiceAreas) {
        profile.firm.areasOfPractice = practiceAreas.split(',').map((area: string) => area.trim());
    }

    // Statutory Profile Last Certified
    const statutoryProfileLastCertified = document.evaluate("//strong[contains(text(), 'Statutory Profile Last Certified On:')]", document, null, xPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element;
    if (statutoryProfileLastCertified) {
        profile.bar.statutoryProfileLastCertified = statutoryProfileLastCertified.parentElement?.textContent?.replace("Statutory Profile Last Certified On:", "").trim();
    }

    // practice-information

    // firm name
    const firmText = document.evaluate("//div[@class='practice-information']//strong[contains(text(), 'Firm:')]", document, null, xPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element;
    if (firmText?.parentElement) {
        const firmInfoText = firmText.parentElement.textContent?.trim() || '';
        const firm = firmInfoText.match(/Firm:\s*([^:]+?)(?:\s*$|\s*:)/)?.[1];
        if (firm && firm !== 'None Reported By Attorney') {
            profile.firm.name = firm.trim();
        }
    }

    // firm size
    const firmSize = document.evaluate("//strong[contains(text(), 'Firm Size:')]", document, null, xPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element;
    if (firmSize?.parentElement) {
        profile.firm.size = firmSize.parentElement.textContent?.split(':')[1]?.trim();
    }

    // firm occupation
    const firmOccupation = document.evaluate("//strong[contains(text(), 'Occupation:')]", document, null, xPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element;
    if (firmOccupation?.parentElement) {
        profile.firm.occupation = firmOccupation.parentElement.textContent?.split(':')[1]?.trim();
    }

    // contact phone
    const phoneLink = document.querySelector('a[href^="tel:"]');
    if (phoneLink) {
        profile.contact.phone = phoneLink.textContent?.replace('Tel: ', '').trim();
    }

    // contact website
    const websiteLink = document.evaluate("//a[contains(text(), 'VISIT WEBSITE')]", document, null, xPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element;
    if (websiteLink) {
        profile.contact.website = websiteLink.getAttribute('href') || undefined;
    }

    // contact email
    profile.contact.email = !!document.evaluate("//a[contains(text(), 'EMAIL NOW')]", document, null, xPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    // contact social media links
    const socialLinks = document.querySelectorAll('.lawyer .social a');
    socialLinks.forEach((link: Element) => {
        const href = link.getAttribute('href');
        if (!href) return;

        profile.contact.socialMediaLinks.push(href);
    });


    // Parse education
    const educationTable = document.querySelector('.school table tbody');
    if (educationTable) {
        const rows = educationTable.querySelectorAll('tr');
        rows.forEach((row: Element) => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 0) {
                const [schoolCell, dateCell] = cells;
                const schoolText = schoolCell.textContent?.trim() || '';
                const [school, degree] = schoolText.split('\n').map((s: string) => s.trim());
                const education = {
                    school,
                    graduationDate: dateCell?.textContent?.trim() || schoolCell.querySelector('.show-mobile')?.textContent?.replace('Graduation Date', '')?.trim(),
                    degree,
                };
                profile.education.push(education);
            }
        });
    }

    // Parse court admissions
    const federalCourts = document.evaluate("//strong[contains(text(), 'Federal:')]", document, null, xPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element;
    if (federalCourts?.parentElement) {
        const courts = federalCourts.parentElement.textContent?.split(':')[1]?.trim();
        if (courts && courts !== 'None Reported By Attorney') {
            profile.courtAdmissions.federal = courts.split('\n').map((court: string) => court.trim()).filter(Boolean);
        }
    }

    const otherCourts = document.evaluate("//strong[contains(text(), 'Other Courts:')]", document, null, xPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element;
    if (otherCourts?.parentElement) {
        const courts = otherCourts.parentElement.textContent?.split(':')[1]?.trim();
        if (courts && courts !== 'None Reported By Attorney') {
            profile.courtAdmissions.otherCourts = courts.split('\n').map((court: string) => court.trim()).filter(Boolean);
        }
    }

    const otherStates = document.evaluate("//strong[contains(text(), 'Other States Licensed:')]", document, null, xPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element;
    if (otherStates?.parentElement) {
        const states = otherStates.parentElement.textContent?.split(':')[1]?.trim();
        if (states && states !== 'None Reported By Attorney') {
            profile.courtAdmissions.otherStates = states.split('\n').map((state: string) => state.trim()).filter(Boolean);
        }
    }

    // Parse recognition/certifications
    const certifications = document.querySelector('figure.certified');
    if (certifications) {
        profile.recognition = {
            boardCertifications: [],
            other: []
        };
        const certLinks = certifications.querySelectorAll('figcaption a');
        certLinks.forEach((link: Element) => {
            const certText = link.textContent?.trim();
            if (certText) {
                profile.recognition!.boardCertifications.push(certText);
            }
        });
    }

    const badges = document.querySelector('.badges');
    if (badges) {
        if (!profile.recognition) {
            profile.recognition = {
                boardCertifications: [],
                other: []
            };
        }
        const badgeImages = badges.querySelectorAll('img');
        badgeImages.forEach((img: Element) => {
            const title = img.getAttribute('title');
            if (title) {
                profile.recognition!.other.push(title);
            }
        });
    }


    return profile;
};

export const profiles = async () => {
    let contactID = FIRST_CONTACT_ID;
    let unavailableCount = 0;
    while (true) {
        console.log(`Fetching ${contactID}`);
        await delay(1000);
        const url = composeProfileUrl(contactID);
        contactID++;

        if (profileExists(REGION, contactID.toString())) {
            console.log(`Skipping ${contactID} because it already exists`);
            continue;
        }

        const html = await fetchProfilePage(url);

        if (html.includes("I'm sorry but this page is currently unavailable. Please try again later.")) {
            console.log(`Skipping ${contactID} because it is unavailable`);
            unavailableCount++;
            if (unavailableCount > 10) {
                console.log("Too many unavailable profiles, stopping at: ", contactID);
                break;
            }
            continue;
        }

        saveProfile(REGION, contactID.toString(), html, "html");
        
        const profile = parseProfilePage(html);
        saveProfile(REGION, contactID.toString(), profile, "json");
    }
}