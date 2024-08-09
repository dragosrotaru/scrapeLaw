process.env.NODE_OPTIONS = "--no-deprecation";

import fs from "fs";
import { JSDOM } from "jsdom";

const index_url = "https://lsbc.vic.gov.au/register-of-lawyers?query=&start_rank=";
const barrister_url = "https://www.vicbar.com.au/find-barrister?term=&signed_bar_roll=All&qualifications=&keywords=&silk_or_junior=All&accredited_mediator=All&directbriefs=All&adv_accredited_mediator=All&directaccess=All&arbitration=All&gender=All&icc_accreditation=All&pss=All&items_per_page=200&sort_bef_combine=field_seniority_sort_order+ASC&page=1";

async function get_lawyer_index() {
    const file_name = "lawyer-index.json";
    let index = {
        start_rank: 0,
        results: [],
    };

    // Read the last completed combo from file if exists
    if (fs.existsSync(file_name)) {
        index = JSON.parse(fs.readFileSync(file_name, 'utf8'));
    }

    while (true) {
        const url = new URL(index_url);
        url.searchParams.set("start_rank", index.start_rank);
        const response = await fetch(url);
        const html = await response.text();
        // all divs with search-content class (has divs inside)
        const results = new JSDOM(html).window.document.querySelectorAll("div.search-content");
        const has_results = results.length > 0;
        if (!has_results) break;
        results.forEach((result) => {
            index.results.push(result.outerHTML);
        });
        index.start_rank += results.length;
        console.log(`start rank ${index.start_rank} results ${results.length}`);
        fs.writeFileSync(file_name, JSON.stringify(index, null, 4));
    }
}

async function get_barrister_index() {
    const file_name = "barrister-index.json";
    let index = {
        page: 0,
        barristers: [],
    };

    if (fs.existsSync(file_name)) {
        index = JSON.parse(fs.readFileSync(file_name, 'utf8'));
    }

    while (true) {
        const url = new URL(barrister_url);
        url.searchParams.set("page", index.page);
        const response = await fetch(url);
        const html = await response.text();
        const no_results = html.includes("No Result Found");
        if (no_results) break;
        // .user-profile 
        const results = new JSDOM(html).window.document.querySelectorAll(".user-profile");
        results.forEach((result) => {
            index.barristers.push(result.outerHTML);
        });
        index.page++;
        console.log(`page ${index.page} results ${results.length}`);
        fs.writeFileSync(file_name, JSON.stringify(index, null, 4));
    }
}

async function get_barrister_detail() {
    const { barristers } = JSON.parse(fs.readFileSync("barrister-index.json"));
    const ids = barristers.map(b => b.match(/about="\/profile\/(\d+)"/)[1])
    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        console.log(`Processing ${id} ${i + 1} of ${ids.length}`)
        const response = await fetch(`https://www.vicbar.com.au/profile/${id}`);
        const html = await response.text();
        fs.writeFileSync(`barrister-detail/${id}.html`, html);
    }
}

get_barrister_detail();