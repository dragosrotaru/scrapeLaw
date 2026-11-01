# scrapeLaw

Scrapers and a parsing pipeline for public lawyer and barrister directories run by law societies and bar associations.

The goal was a normalized dataset of legal professionals (name, firm, contact details, status, call date) built from dozens of differently shaped sources. Each source is scraped once into raw HTML or JSON. A generic pipeline then works out which parts of each page are template and which are data, extracts the fields, and normalizes them.

## Coverage

| Region | Sources |
|---|---|
| Canada | Alberta, British Columbia, CPB, Manitoba, New Brunswick, Newfoundland and Labrador, Northwest Territories, Nova Scotia, Nunavut, Ontario, Prince Edward Island, Quebec, Saskatchewan, Yukon |
| Australia | NSW, Queensland, South Australia, Tasmania, Victoria, Western Australia (solicitors and barristers) |
| New Zealand | Lawyers and barristers |
| United States | Arizona, Florida, Georgia, Illinois, Michigan, Ohio, Texas ([`united-states/`](united-states/README.md), a separate package) |

Each source lives in `src/sites/<region>/scrape.mts` and exposes an `index()` function. The scrapers use whatever the site offers: JSON search APIs, paginated or alphabet-tree index walks, or headless Chrome (Puppeteer) where needed.

## Pipeline

```
src/
  1-scrape/     shared helpers: index by page or character, fetch and cache detail pages
  2-prepare/    isolate the record HTML, strip boilerplate, normalize whitespace
  3-represent/  tokenize and vectorize the corpus, detect template vs variable tokens, outliers
  4-extract/    pull fields out of the variable tokens (heuristics plus OpenAI for hard cases)
  5-normalize/  build typed person and firm records, validate phones, emails and addresses
  sites/        one scraper per directory
  utility/      IO, GPT client, validators
  python/       standalone Ontario scraper
```

## Usage

Requires Node 22+ and pnpm.

```bash
pnpm install
cp .env.example .env   # fill in the keys you need
npx tsx --env-file=.env src/index.mts scrape -s canada_ontario
npx tsx --env-file=.env src/index.mts prep -s canada_ontario -l 1000
npx tsx --env-file=.env src/index.mts rep -s canada_ontario
```

Scraped data is written to `data/<site>/` and is never committed. The dataset stays local.

## Status

Experimental and no longer maintained. Directory sites change their markup and APIs often, so individual scrapers have probably drifted. Respect each site's terms of use and rate limits.

Research notes are in [`docs/research-links.md`](docs/research-links.md).
