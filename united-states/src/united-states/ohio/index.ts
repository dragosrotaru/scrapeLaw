import { saveIndex } from "../../lib/storage";
import { REGION } from "./region";

const RESULTS_PER_PAGE = 500;

const composeIndexUrl = (pageNumber: number) => {
  const sortData = {
    criteria: "nameAZ",
    pageNumber,
    pageLength: RESULTS_PER_PAGE,
    Positions: [],
    SortField: "Name",
    SortDescending: false,
  };
  const searchData = [
    { Name: "AreasOfLaw", Values: [] },
    { Name: "Certifications", Values: [] },
    { Name: "Languages", Values: [] },
    { Name: "Location", Values: [] },
    { Name: "PracticeAreas", Values: [] },
  ];
  return `https://www.ohiobar.org/FindALawyerSearch?sortData=${encodeURIComponent(JSON.stringify(sortData))}&searchData=${encodeURIComponent(JSON.stringify(searchData))}`;
};


const fetchIndex = async (pageNumber: number) => {
    const response = await fetch(composeIndexUrl(pageNumber));
    return await response.json();
}

export const index = async () => {
    let maxResults = Infinity;
    let pageNumber = 1;
    const data = [];
    while (maxResults > data.length) {
        console.log(`Fetching page ${pageNumber} of ${maxResults / RESULTS_PER_PAGE}`);
        const { results, totalCount } = await fetchIndex(pageNumber);
        data.push(...results.Lawyers);

        if (maxResults === Infinity) {
            maxResults = totalCount;
        }
        pageNumber++;
    }
    saveIndex(REGION, data, "json");
}