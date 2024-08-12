import fs from "fs";

const index_url = "https://www.barreau.qc.ca/en/find-a-lawyer/results/?p="
const detail_url = "https://www.barreau.qc.ca/en/find-a-lawyer/member/?id="

export async function index() {
    let index = {
        last: 1,
        pages: 1,
        results: [],
    }
    
    if (fs.existsSync("index.json")) {
        index = JSON.parse(fs.readFileSync("index.json", "utf8"));
    }
    
    for (let i = index.last; i <= index.pages; i++) {
        const response = await fetch(index_url + i);
        const text = await response.text();


        const num_results = text.match(/<p class="mb-0 h-8 text-p3 font-medium px-4 leading-normal">\s+(\d+) results/);
        if (!num_results) {
            console.log('no results found');
            continue;
        }
        index.pages = Math.ceil(num_results[1] / 25);

        const table_body = text.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/);
        if (!table_body) {
            console.log('no table body found');
            continue;
        }
    
        const rows = table_body[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/g);
        // extract id href="/en/find-a-lawyer/member/?id=caa148469da2840a26276b20f2220ca61d9334019abd255a575f32b99a12cd37&amp;backUrl=%2Fen%2Ffind-a-lawyer%2Fresults%2F%3Fp%3D1"
        const ids = rows
            .filter(row => row.includes("/en/find-a-lawyer/member/?id="))
            .map(row => row.match(/id=([^&]+)/)[1]);
        
        index.last = i;
        index.results = index.results.concat(rows);
        console.log('page:', i, 'rows:', rows.length);
    
        fs.writeFileSync("index.json", JSON.stringify(index, null, 4));
    }
}

export async function detail() {
    const { results: index } = JSON.parse(fs.readFileSync("index.json", "utf8"));
    // todo remove these lines
    const filtered = index.filter(row => row.includes("/en/find-a-lawyer/member/?id="));
    const ids = filtered.map(row => row.match(/id=([^&]+)/)[1]);
    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const filename = "detail/" + id + ".html";

        if (fs.existsSync(filename)) {
            console.log(`id ${id} ${i} of ${ids.length} exists`);
            continue;
        }

        const response = await fetch(detail_url + id, {
            // agent
        });
        const text = await response.text();

        if (text.includes("Security measure") || text.includes("You have reached the limit of requests allowed daily")) {
            console.log(`id ${id} ${i} of ${ids.length} captcha or limit`);
            throw new Error("captcha or limit");
        }

        console.log(`id ${id} ${i} of ${ids.length} ${response.status}`);
        fs.writeFileSync(filename, text);
    }
}