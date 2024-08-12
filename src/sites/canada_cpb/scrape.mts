import fs from "fs";

const url = "https://cpbcan.ca/career-centre/find-a-bookkeeper.html/ipbc/bookkeeper-directory/index/page/";

async function get_index() {
    let page = 1;
    while (true) {
        const response = await fetch(url + page);
        const data = await response.text();
        // match all urls of the form:
        // https://cpbcan.ca/career-centre/find-a-bookkeeper.html/ipbc/bookkeeper-directory/view/id/{ID}
        const urls = data.match(/\/career-centre\/find-a-bookkeeper.html\/ipbc\/bookkeeper-directory\/view\/id\/\d+/g);
        if (!urls) {
            console.log("No more results found");
            break;
        }

        // get IDs
        let ids = urls.map(url => url.split('/').pop());
        ids = ids.filter((id, index) => ids.indexOf(id) === index);

        // log number of results
        console.log(page, ids.length);

        // Save current page to file
        fs.appendFileSync('index.txt', ids.join('\n') + '\n');
        page++;
    }
}

async function get_detail() {
    const data = fs.readFileSync('index.txt', 'utf8');
    let ids = data.split('\n');

    // filter out empty lines and duplicates
    ids = ids.filter(id => id.length > 0);
    ids = ids.filter((id, index) => ids.indexOf(id) === index);

    console.log("Total IDs", ids.length);

    for (const id of ids) {
        console.log("Processing", id);
        // check if already saved
        if (fs.existsSync(`detail/${id}.html`)) {
            console.log("Already saved", id);
            continue;
        }

        const url = "https://cpbcan.ca/career-centre/find-a-bookkeeper.html/ipbc/bookkeeper-directory/view/id/" + id;
        const response = await fetch(url);
        const data = await response.text();
        
        // save in detail folder
        fs.writeFileSync(`detail/${id}.html`, data);
    }
}

get_detail();