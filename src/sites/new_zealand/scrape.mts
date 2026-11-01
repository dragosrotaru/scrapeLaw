import {
  fetchText,
  fileExists,
  readJSONFile,
  writeJSONFile,
} from "../../utility/io.mts";
import {
  CharacterIndex,
  CHARACTERS,
  getDetail,
  indexFilePath,
  PageIndex,
} from "../../1-scrape/scrape.mts";
import { printProgress } from "../../1-scrape/print.mts";

const SITE = "new_zealand";
const INDEX_FILE_PATH = indexFilePath(SITE);

const BASE_URL = "https://www.lawsociety.org.nz/";
const INDEX_URL =
  BASE_URL +
  "for-the-public/find-a-lawyer/?sort=&direction=asc&PracticeAreas=&Specialisation=&Regions=&RegulatoryCertificateTypes=&Languages=&sort_proximity=2012&page_size=1000&Keyword=&page=2";
const DETAIL_URL = BASE_URL + "register/";
const detailUrl = (id: string) => DETAIL_URL + id + "/";

// about 16,401 practicing certificate lawyers, but the results max out at 10000.

export async function index() {
  const index: CharacterIndex & PageIndex = fileExists(INDEX_FILE_PATH)
    ? readJSONFile(INDEX_FILE_PATH)
    : {
        character: "a",
        page: 2,
        ids: [],
        timestamp: new Date().toISOString(),
      };

  const startIndex = CHARACTERS.indexOf(index.character);
  for (let i = startIndex; i < CHARACTERS.length; i++) {
    index.character = CHARACTERS[i];

    const url = new URL(INDEX_URL);
    url.searchParams.set("Keyword", index.character);

    index.page = 2;
    while (true) {
      url.searchParams.set("page", index.page.toString());
      const html = await fetchText(url.toString());

      // href="/register/ian-stewart-avison/?glh=1"
      const ids = [...html.matchAll(/href="\/register\/([^\/]+)\/\?/g)].map(
        (m) => m[1]
      );
      const uniques = ids.filter((id) => !index.ids.includes(id));

      if (uniques.length === 0) break;
      index.ids.push(...uniques);

      printProgress(i, CHARACTERS.length, index.page.toString());
      writeJSONFile(INDEX_FILE_PATH, index);
      index.page++;
    }
  }
}

export async function detail() {
  return getDetail(SITE, detailUrl);
}
