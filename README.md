# scrapeLaw

Scrapers for 30+ public lawyer and barrister directories across Canada, Australia, New Zealand and the US. Alongside them is an experimental pipeline that works out the structure of each site's profile pages **without per-site parsing rules**.

Every law society publishes its directory differently: Azure search indexes, undocumented JSON APIs, ColdFusion forms with captchas, alphabetical listings with hidden result caps. The project has two halves:

1. **Collection.** One small scraper per directory that walks its search space to completion, caches raw pages and resumes after interruption.
2. **Structure discovery.** A generic pipeline that takes thousands of raw profile pages from one site, learns which tokens are template and which are data, and flags pages that don't fit the template.

## Highlights

**Unsupervised template detection.** Given a corpus of profile pages from a single site ([`src/3-represent/`](src/3-represent)):
- A hand-written, fault-tolerant HTML lexer turns each page into tokens. Tags are normalized to their name plus sorted attribute names; text is split on whitespace ([`parser.mts`](src/3-represent/parser.mts)).
- Tokens become integers in a shared vocabulary. Markup gets odd ids, text gets even ids and `0` is reserved for "template", so a token's type is just its parity ([`vector.mts`](src/3-represent/vector.mts)).
- Tokens that appear in at least a threshold share of documents are collapsed to `0`, runs of template tokens are merged, and repeated sequences are de-duplicated. What's left is the record data.

**Automatic threshold selection and outlier detection** ([`outlier.mts`](src/3-represent/outlier.mts)). Rather than hard-coding "template" as "appears in 95% of pages":
- For a random sample of pages, it lowers the threshold from 1.0 in 0.001 steps until the number of data tokens stops changing, and averages those stable points.
- Template tokens that drop out between 1.0 and the chosen threshold form a diff set. Pages missing them are ranked as structural outliers, such as error pages, alternate layouts or partial records.
- It reports the observed outlier rate against the expected one.

**Boilerplate isolation** ([`src/2-prepare/isolate.mts`](src/2-prepare/isolate.mts)). Before tokenizing, it finds the longest prefix and suffix shared by every document, character by character but never splitting a tag, and strips them. This removes site chrome without knowing the site.

**Getting past search-result caps.** Many directories return at most N results per query:
- Two-letter prefix enumeration, with any prefix that hits the cap queued and expanded one letter deeper ([New Brunswick](src/sites/canada_newbrunswick/scrape.mts)).
- A serializable alphabet tree that recursively narrows queries until each returns fewer than the cap ([`united-states/src/lib/AlphabetTree.ts`](united-states/src/lib/AlphabetTree.ts)).
- Generic resumable walks by character or page that persist progress after every step ([`src/1-scrape/scrape.mts`](src/1-scrape/scrape.mts)).

**Finding the cheapest door.** Most scrapers avoid HTML entirely by finding the API behind the search page:
- Ontario queries the site's Azure Cognitive Search index with OData paging.
- Several provinces and the US states call undocumented JSON endpoints, some with a single request that returns the whole register.
- Alberta's form returns the full directory when the name field is a single space.
- Puppeteer is used only where a site has no other way in.

**Captcha-gated contact details.** British Columbia hides each email behind a ColdFusion image captcha and a JavaScript obfuscation function. The scraper passes the captcha image to a vision model ([`src/utility/gpt.mts`](src/utility/gpt.mts)), retries on failure, tracks solve rates, and reproduces the de-obfuscation step to recover the address ([`canada_britishcolumbia/scrape.mts`](src/sites/canada_britishcolumbia/scrape.mts)).

**Provenance-aware data model** ([`src/5-normalize/types.mts`](src/5-normalize/types.mts)). Normalized records are entities and attributes in which every value carries the method that produced it, a confidence and a timestamp, with content-hashed ids. Validators handle phone numbers (libphonenumber), emails, URLs, names and about a dozen date formats ([`src/utility/validators.mts`](src/utility/validators.mts)).

## Coverage

| Region | Directories |
|---|---|
| Canada | Alberta, British Columbia, Manitoba, New Brunswick, Newfoundland and Labrador, Northwest Territories, Nova Scotia, Nunavut, Ontario, Prince Edward Island, Quebec, Saskatchewan, Yukon, CPB |
| Australia | NSW, Queensland, South Australia, Tasmania, Victoria, Western Australia (law societies and bar associations) |
| New Zealand | Law Society register, barristers |
| United States | Georgia, Ohio, Florida, Texas (plus started: Arizona, Illinois, Michigan), in [`united-states/`](united-states/) |

## Layout

```
src/
  index.mts        CLI: scrape | prep | rep
  1-scrape/        resumable index walks, cached detail fetching
  2-prepare/       HTML cleanup and shared-boilerplate removal
  3-represent/     lexer, vectorizer, template and outlier detection
  4-extract/       LLM field extraction (prototype)
  5-normalize/     provenance data model and validators
  sites/<site>/    one scraper per directory
  utility/         IO, OpenAI client, validators
united-states/     separate package for US state bars
```

## Usage

Requires Node 22+ and pnpm.

```bash
pnpm install
cp .env.example .env     # only needed for sites or steps that use keys
pnpm start scrape -s canada_ontario
pnpm start prep   -s canada_ontario -l 1000
pnpm start rep    -s canada_ontario
```

Scraped data is written to `data/<site>/` and is not committed.

## Status

This is a personal research project from 2024-2025, and it's no longer maintained.

- **Working:** collection for most Canadian, Australian and New Zealand directories, plus Georgia and Ohio; the prepare and represent stages.
- **Prototype:** LLM field extraction (`4-extract`, not wired into the CLI), normalization (written for Manitoba only), the remaining US states and a few partial scrapers (Nova Scotia, Queensland, NSW barristers).
- **Tests:** the lexer, vectorizer and HTML utilities have unit tests written for Deno (`*.test.mts`). They aren't wired into the Node toolchain.
- **Expect drift:** directory sites change their markup and APIs, so individual scrapers have likely broken since they were written.

## Responsible use

These directories are published so the public can verify a lawyer's standing. Check each site's terms of use before running a scraper, keep request rates low (the scrapers include delays and resume rather than re-fetch), and don't use the results for unsolicited bulk contact.
