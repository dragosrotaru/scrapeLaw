import fs from "fs";

// https://www.qls.com.au/Directory-Search#
// https://www.qls.com.au/Pages/Register

export async function getIndex() {
    const pages = [
        "https://www.qls.com.au/getattachment/33120c21-4c06-4aba-8596-0a039cc3afa2/register-of-solicitors-20240320-a-f.pdf",
        "https://www.qls.com.au/getattachment/deebcbe5-e3ba-482b-8801-d1151023aec8/register-of-solicitors-20240320-g-l.pdf",
        "https://www.qls.com.au/getattachment/1362cb96-369e-48dc-b243-0c9476f27f7c/register-of-solicitors-20240320-m-r.pdf",
        "https://www.qls.com.au/getattachment/5725a6b9-2bc5-4c37-9f02-c2c3ad4fef0b/register-of-solicitors-20240320-s-z.pdf"
    ];
    // download PDFs and save them
    const results: string[][] = [];
    for (let i = 0; i < 1; i++) {
        const url = pages[i];
        // const response = await fetch(url);
        // todo save files
        const id = i + 1;
        const file_name = "index-" + id + ".csv";
        const text = fs.readFileSync(file_name, "utf-8");
        
        // split into lines
        let lines = text.split("\r\n");
        
        // filter repeating title and header lines
        const title = "\"\",QLS Register of Solicitors as at 20/03/2024,,,,,,,,,";
        const header = "\"\",First Name,Middle Name,Last Name,Practising Certificate Type,Conditions,Specialist Accreditation Area,Employer Name,Employer Address 1,Employer Address 2,Date of Admission";
        lines = lines.filter(line => line !== title && line !== header);
        
        // split lines into columns
        let columns = lines.map(line => line.split(","));
        
        // remove first column
        columns = columns.map(line => line.slice(1));
        
        // remove empty lines
        columns = columns.filter(line => line.length > 1);
        columns = columns.map(line => {
            let last = line[line.length - 1];
            let second_last = line[line.length - 2];
            const remainder = line.slice(0, line.length - 2);

            // if last column doesnt have "23/04/2015" format, remove all letters from it
            if (last.length > 10) {
                last = last.replace(/[a-zA-Z]/g, "");
            }
           
            return [...remainder, second_last, last];
        });
        // add to results
        results.push(...columns);
    }
    // save results

    fs.writeFileSync("index.json", JSON.stringify(results, null, 4));
}