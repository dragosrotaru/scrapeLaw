process.env.NODE_OPTIONS = "--no-deprecation";

import fs from "fs";
import { captchaSolver } from "../../utility/gpt.mts";

const index_url =
  "https://www.lawsociety.bc.ca/lsbc/apps/lkup/directory/mbr-search.cfm?txt_search_type=1&txt_given_nm=&txt_city=&member_search=Search&is_submitted=1&results_no=10000&txt_last_nm=";

export async function index() {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let index = {
    last: "aa",
    results: [],
  };

  if (fs.existsSync("index.json")) {
    index = JSON.parse(fs.readFileSync("index.json", "utf8"));
  }

  let startIndex = chars.indexOf(index.last[0]);
  let startSubIndex = chars.indexOf(index.last[1]) + 1;

  for (let i = startIndex; i < chars.length; i++) {
    for (let j = i === startIndex ? startSubIndex : 0; j < chars.length; j++) {
      const combo = chars[i] + chars[j];

      let response = await fetch(index_url + combo);
      const text = await response.text();

      const table_body = text.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/);
      if (!table_body) {
        console.log("no table body found");
        continue;
      }

      const rows = table_body[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/g);
      index.last = combo;
      index.results = index.results.concat(rows);
      console.log("combo:", combo, "rows:", rows.length);

      fs.writeFileSync("index.json", JSON.stringify(index, null, 4));
    }
  }
}

export async function detail() {
  const { results: index } = JSON.parse(fs.readFileSync("index.json", "utf8"));
  const ids = index.map(
    (row) => row.match(/mbr-details\.cfm\?encrypted=([^"]+)#_toph1/)[1]
  );

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const filename = `detail/${id}.html`;
    if (fs.existsSync(filename)) {
      console.log("skipping", id);
      continue;
    }

    const detail_url = `https://www.lawsociety.bc.ca/lsbc/apps/lkup/directory/mbr-details.cfm?encrypted=${id}#_toph1`;
    let response = await fetch(detail_url, {
      headers: {
        Cookie:
          "CFID=REDACTED; CFTOKEN=REDACTED; JSESSIONID=REDACTED",
      },
    });

    console.log(`${id} ${i} of ${ids.length} ${response.status}`);
    const text = await response.text();
    fs.writeFileSync(filename, text);
  }
}

function getEmailIds() {
  // iterate over all detail/*.html files and return the number of them which contain the substring
  // href="javascript:showcap();"
  const files = fs.readdirSync("detail");
  let email_files = [];
  console.log("files:", files.length);
  for (let i = 0; i < files.length; i++) {
    const fime_name = files[i];
    const text = fs.readFileSync(`detail/${fime_name}`, "utf8");
    if (text.includes('href="javascript:showcap();"')) {
      email_files.push(fime_name);
    }
  }
  console.log("emails:", email_files.length);
  return email_files.map((file_name) => file_name.replace(".html", ""));
}


async function getEmailInner(id, captcha_stats) {
  // fetch captcha challenge page
  const url =
    "https://www.lawsociety.bc.ca/lsbc/apps/lkup/directory/if-mbr-details-email.cfm?encrypted=" +
    id;
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-CA,en-US;q=0.7,en;q=0.3",
    "Accept-Encoding": "gzip, deflate, br",
    DNT: "1",
    Connection: "keep-alive",
    Referer: `https://www.lawsociety.bc.ca/lsbc/apps/lkup/directory/mbr-details.cfm?encrypted=${id}`,
    Cookie:
      "JSESSIONID=REDACTED; CFID=REDACTED; CFTOKEN=REDACTED",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "iframe",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    Pragma: "no-cache",
    "Cache-Control": "no-cache",
  };
  const challenge_resp = await fetch(url, {
    headers,
  });

  console.log(
    `fetched captcha challenge ${id} ${challenge_resp.status}`
  );
  const challenge_html = await challenge_resp.text();

  // save challenge for review
  fs.writeFileSync(`email/${id}-challenge.html`, challenge_html);

  // extract captcha id, url and hash

  // <img src="/CFFileServlet/_cf_captcha/_captcha_img6527160742035299756.png" alt=""...
  const captchaId = challenge_html.match(
    /\/CFFileServlet\/_cf_captcha\/_captcha_img([^"]+).png/
  )[1];
  const captchaUrl = `https://www.lawsociety.bc.ca/CFFileServlet/_cf_captcha/_captcha_img${captchaId}.png`;

  // <input type="hidden" name="captchaHash" value="238289652A64EED928F1CEA6E846638A"></input>
  const captchaHash = challenge_html.match(
    /<input type="hidden" name="captchaHash" value="([^"]+)">/
  )[1];

  const captchaImageResponse = await fetch(captchaUrl);
  const captchaBase64 = Buffer.from(
    await captchaImageResponse.arrayBuffer()
  ).toString("base64");
  const captchaAnswer = await captchaSolver(captchaBase64);

  captcha_stats.data[captchaId] = {
    answer: captchaAnswer,
    hash: captchaHash,
    base64: captchaBase64,
    url: captchaUrl,
  };

  console.log("solved captcha", captchaAnswer, captchaHash, captchaId);

  // Submitting captcha answer

  headers.Referer = url;
  headers["Content-Type"] = "application/x-www-form-urlencoded";
  const body = `captcha=${captchaAnswer}&captchaHash=${captchaHash}&pkey=${id}&btnSubmit=Submit`;

  const result_resp = await fetch(url, {
    method: "POST",
    headers,
    body,
  });
  const result_html = await result_resp.text();

  console.log("submitted captcha body: ", body, "result:", result_resp.status);

  // save result for review
  fs.writeFileSync(`email/${id}-result.html`, result_html);

  // extract <script>mail2("name","dom","tl","params","display")</script>
  const email_match = result_html.match(/<script>mail2([^<]+)<\/script>/);
  if (!email_match) {
    throw new Error("email not found");
  }
  return eval("mail2" + email_match[1]);
}

export async function getEmail() {
  let emails = {};
  let captcha_stats = {
    tries: 0,
    success: 0,
    cache_hits: 0,
    data: {},
  };

  if (fs.existsSync("emails.json")) {
    emails = JSON.parse(fs.readFileSync("emails.json", "utf8"));
  }

  if (fs.existsSync("captcha.json")) {
    captcha_stats = JSON.parse(fs.readFileSync("captcha.json", "utf8"));
  }

  const ids = getEmailIds();
  console.log("ids:", ids.length);
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];

    if (emails[id]) {
      console.log("skipping", id);
      continue;
    }

    let tries = 0;
    while (true) {
      try {
        console.log(`${i} of ${ids.length} try ${tries + 1}`, id);
        captcha_stats.tries++;
        const email = await getEmailInner(id, captcha_stats, emails);
        fs.writeFileSync("emails.json", JSON.stringify(emails, null, 4));
        emails[id] = email;
        captcha_stats.success++;
        fs.writeFileSync(
          "captcha.json",
          JSON.stringify(captcha_stats, null, 4)
        );
        break;
      } catch (error) {
        console.log("error", error);
        tries++;
        if (tries > 6) {
          console.log("too many tries, skipping", id);
          break;
        }
      }
    }
  }
}

/* Code pulled from site: https://www.lawsociety.bc.ca/lsbc/apps/scripts/email-o.js */

const tld_ = [
  "com",
  "org",
  "net",
  "ws",
  "info",
  "",
  "",
  "",
  "",
  "",
  "co.uk",
  "org.uk",
  "gov.uk",
  "ac.uk",
  "ca",
];

function mail2(name, domain, tl, params, display) {
  let s = `${name}@`;
  if (tl === -2) return s + swapper(domain);
  s = s + domain;
  if (tl >= 0) s = s + `.${tld_[tl]}`;
  return s;
}
function swapper(domain) {
  var s = "";
  for (var i = 0; i < domain.length; i += 2)
    if (i + 1 == domain.length) s += domain.charAt(i);
    else s += domain.charAt(i + 1) + domain.charAt(i);
  return s.replace(/\?/g, ".");
}
