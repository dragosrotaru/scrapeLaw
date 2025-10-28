import { AlphabetNode, AlphabetTree } from "../../lib/AlphabetTree"
import { saveIndex } from "../../lib/storage";
import { delay } from "../../lib/utils";
import { REGION } from "./region";

const MAX_PAGE_SIZE = 50;

const composeIndexUrl = (lastName: string, pageNumber: number) =>
  `https://www.floridabar.org/directories/find-mbr/?lName=${lastName}&pageNumber=${pageNumber}&pageSize=${MAX_PAGE_SIZE}`


const fetchIndexPage = async (lastName: string, pageNumber: number) => {
    const url = composeIndexUrl(lastName, pageNumber)

    const response = await fetch(url)
    const html = await response.text()

    return html
}

/**
 * Parse the index page of the Florida Bar directory and return the bar numbers
 * and the number of results on the page.
 * 
 * @param html - The HTML of the index page
 * @returns An array of bar numbers and the number of results on the page
 */
const parseIndexPage = (html: string): { barNumbers: string[], resultCount: number, tooMany: boolean } => {
    // Check for too many results message
    const tooMany = html.includes('Too many results');

    // Extract result count using regex
    const countMatch = html.match(/Showing \d+ - \d+\s+of (\d+) results/);
    const resultCount = countMatch ? parseInt(countMatch[1]) : 0;

    // Extract bar numbers using regex
    const barNumberPattern = /profile\/\?num=(\d+)/g;
    const barNumbers: string[] = [];
    let match;
    while ((match = barNumberPattern.exec(html)) !== null) {
        barNumbers.push(match[1]);
    }

    return { barNumbers, resultCount, tooMany };
}

/**
 * Index the Florida Bar directory, returning the index of bar numbers and the tree of nodes.
 * 
 * @returns The index of bar numbers and the tree of nodes.
 */
export const index = async () => {
    const index = new Set<string>();
    const tree = new AlphabetTree();
    
    let node: AlphabetNode | null = null;
    do {
        node = tree.next();
        if (!node) {
            console.warn("No more nodes to process");
            break;
        }
        console.log(`Processing node: ${node.query}`);
        console.log(`Current index size: ${index.size}`);
        console.log(`index: ${Array.from(index).join(", ")}`);


        let page = 1;
        let totalPages = Infinity;
        while (page <= totalPages) {
            console.log(`Fetching page ${page} of ${totalPages} for node: ${node.query}`);
            await delay(500);
            
            // fetch and parse the index page
            const html = await fetchIndexPage(node.query, page);
            const { barNumbers, resultCount, tooMany } = parseIndexPage(html);

            console.log(`Found ${resultCount} results on page ${page}${tooMany ? " - too many" : ""}`);

            // calculate the total number of pages only once
            if (totalPages === Infinity) {
                totalPages = Math.ceil(resultCount / MAX_PAGE_SIZE);
            }

            // add the bar numbers to the index
            barNumbers.forEach(barNumber => index.add(barNumber));
            
            // set the number of results for the node
            node.numResults = tooMany ? "tooMany" : resultCount;
            page++;

            if (tooMany) {
                break;
            }
        }

    } while (node)

    // write the index to a file
    saveIndex(REGION, Array.from(index), "json");

    return { index, tree };
}