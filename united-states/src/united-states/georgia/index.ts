import { readIndex, saveFilteredIndex, saveIndex } from "../../lib/storage";
import { REGION } from "./region";

const COMMON_EMAIL_PROVIDERS = [
  "gmail",
  "yahoo",
  "outlook",
  "icloud",
  "hotmail",
  "aol",
  "comcast",
  "verizon",
];

const TRANSACTIONAL_SECTIONS = [
    "Business Law",
    "Corporate Counsel",
    "Franchise & Distribution Law",
    "Real Property Law",
    "Construction Law",
    "Bankruptcy Law",
    "Taxation Law",
    "Employee Benefits Law",
    "Insurance Law",
    "Privacy & Technology",
    "Health Law",
    "Entertainment & Sports Law",
    "Nonprofit Law",
    "E-Discovery & the Use of Technology",
    "Labor & Employment Law",
    "International Law",
    "Energy Law",
];

const UNIQUE_SECTIONS = new Set();

export const filterProfiles = () => {
  const { members } = readIndex(REGION);
  const filtered = members.filter((member: any) => {
    const hasEmail =
      member.email.trim().length > 2 && member.email.includes("@");
    const hasFirstName =
      member.firstName.trim().length > 0 && member.firstName !== "(Erased)";
    const hasPersonalEmail = COMMON_EMAIL_PROVIDERS.some((provider) =>
      member.email.includes(provider)
    );
    const hasGovernmentEmail = member.email.includes(".gov");
    const isActive = member.status === "Active Member in Good Standing";
    const hasSections = member.sections !== null;
    const hasTransactionalSections = hasSections && member.sections.some((section: any) =>
      TRANSACTIONAL_SECTIONS.includes(section.sectionName)
    );
    return (
      hasEmail &&
      hasFirstName &&
      !hasPersonalEmail &&
      !hasGovernmentEmail &&
      isActive &&
      hasTransactionalSections
    );
  });
  filtered.forEach((member: any) => {
    member.sections.forEach((section: any) => {
      UNIQUE_SECTIONS.add(section.sectionName);
    });
  });

  // flatten sections
  const flattened = filtered.map((member: any) => {
    return {
      ...member,
      sections: member.sections.map((section: any) => section.sectionName).join(", "),
    };
  });

  // console.log(UNIQUE_SECTIONS);
  console.log(`Filtered ${members.length} members to ${filtered.length}`);
  saveFilteredIndex(REGION, flattened, "json");
};

const fetchIndex = async () => {
  const response = await fetch(
    `https://api.gabar.org/webservices/membersearch?top=100000`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        top: 100000,
      }),
    }
  );
  return await response.json();
};

export const index = async () => {
  const data = await fetchIndex();
  saveIndex(REGION, data, "json");
};
