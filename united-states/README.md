# US state bar scrapers

A standalone TypeScript package (run with `tsx`) that collects member directories from US state bars. It is part of [scrapeLaw](../README.md). Shared helpers are in `src/lib/`: a resumable `AlphabetTree` for splitting searches that hit a result cap, a Puppeteer wrapper and JSON storage.

## Status

### United States

#### Florida

- requires puppeteer and html parsing
- very slow because of rate limiting.
- The tree indexing isn't working well because there isn't a clear signal of when there are too many results vs no results at all

#### Texas

- simple since we can just increment through the BAR number space, no indexing required
- somewhat limited since no emails are available (we can still scrape websites)

#### Georgia ✅

- very simple, just a JSON API returning all the results at once

#### Illinois

- simple, paginated JSON API returns all results, but it is rate limited

### Michigan

- same provider as Illinois

### Ohio ✅

- simple, paginated JSON API returns all results


## Next steps

- add more easy regions
- implement Michigan and Illinois
- implement CLI
- standardize filtering
- standardize caching / saving and add time / hash
- complete Florida run
- fix florida indexing
- complete Texas run
