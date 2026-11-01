
const ROOT_PROJECT_PATH = new URL("../", import.meta.url).pathname; // repository root
export const ROOT_DATA_PATH = ROOT_PROJECT_PATH + "data/";
export const ROOT_SCRAPER_PATH = ROOT_PROJECT_PATH + "sites/";

/* Prepare */
export const SAMPLE_LIMIT = 1000; // limiting the entire analysis
export const REMOVE_HEAD = true; // remove head tags

/* Represent */
export const PRINT_LENGTH = 256; // truncation length for print
export const OUTLIER_SAMPLES = 20;
export const OUTLIER_DEINCREMENT = 0.001;
export const OUTLIER_MAX_TRESHOLD = 1;
export const OUTLIER_MIN_TRESHOLD = 0.95;
export const OUTLIER_ERROR_MARGIN = 0.005;
