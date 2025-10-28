import fs from "node:fs";

const index_url =
  "https://lsnb.alinityapp.com/Client/PublicDirectory/Registrants";

async function api(search) {
  const body = new FormData();
  body.append("querySID", "1000602");
  body.append(
    "queryParameters",
    JSON.stringify({
      Parameter: [
        { ID: "TextOptionA", Value: search, ValueLabel: "[not+entered]" },
        { ID: "TextOptionD", Value: "", ValueLabel: "[not+entered]" },
        {
          ID: "SpecializationSID",
          Value: "-",
          ValueLabel: "[not+entered]",
        },
        { ID: "TextOptionB", Value: "", ValueLabel: "[not+entered]" },
        { ID: "TextOptionC", Value: "", ValueLabel: "[not+entered]" },
        { ID: "GenderPronoun", Value: "-", ValueLabel: "[not+entered]" },
        { ID: "TextOptionE", Value: "", ValueLabel: "[not+entered]" },
      ],
    })
  );
  let response = await fetch(index_url, {
    method: "POST",
    body,
  });

  // try again if error
  if (response.status !== 200) {
    console.log("error, backing off");
    await new Promise((resolve) =>
        setTimeout(resolve, 30000)
    );
    response = await fetch(index_url, {
        method: "POST",
        body,
      });
  }
  return await response.json();
}

export async function index() {
  const file_name = "index.json";
  const characters = "abcdefghijklmnopqrstuvwxyz";

  let index = {
    char: "aa",
    results: [],
    over: [],
  }; // Default starting index

  // Read the last completed index from file if exists
  if (fs.existsSync(file_name)) {
    index = JSON.parse(fs.readFileSync(file_name, "utf8"));
  }

  let startIndex = characters.indexOf(index.last[0]);
  let startSubIndex = characters.indexOf(index.last[1]) + 1;

  for (let i = startIndex; i < characters.length; i++) {
    for (
      let j = i === startIndex ? startSubIndex : 0;
      j < characters.length;
      j++
    ) {
      index.char = characters[i] + characters[j];
      const data = await api(index.char);
      if (data.Records.length === 200) {
        index.over.push(index.char);
      }
      index.results.push(...data.Records);
      console.log(index.char, data.Records.length);
      fs.writeFileSync(file_name, JSON.stringify(index, null, 4));
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 10000 + 2000)
      );
    }
  }
}

export async function getOver() {
  const file_name = "index.json";
  const characters = "abcdefghijklmnopqrstuvwxyz";

  let index = {
    char: "aa",
    results: [],
    over: [],
  }; // Default starting index

  // Read the last completed index from file if exists
  if (fs.existsSync(file_name)) {
    index = JSON.parse(fs.readFileSync(file_name, "utf8"));
  }

  for (let i = 0; i < index.over.length; i++) {
    for (let j = 0; j < characters.length; j++) {
      console.log(index.over[i], characters[j]);
      index.char = index.over[i] + characters[j];
      const data = await api(index.char);
      if (data.Records.length === 200) {
        index.over.push(index.char);
      }
      index.results.push(...data.Records);
      console.log(index.char, data.Records.length);
      fs.writeFileSync(file_name, JSON.stringify(index, null, 4));
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 10000 + 2000)
      );
    }
  }
}

export async function detail() {
  const { results } = JSON.parse(fs.readFileSync('index.json', 'utf8'));
  for (let i = 0; i < results.length; i++) {
      const { rg: id } = results[i];
      const file_name = `detail/${id}.html`;
      if (fs.existsSync(file_name)) {
          console.log('skipping', id);
          continue;
      }
      const detail_url = `https://lsnb.alinityapp.com/Client/PublicDirectory/Registrant/${id}`;
      const response = await fetch(detail_url);
      const html = await response.text();
      fs.writeFileSync(file_name, html);
      console.log('saved', id, i + 1, 'of', results.length);
      // await new Promise(resolve => setTimeout(resolve, Math.random() * 10000 + 1000));
  }
}

index();