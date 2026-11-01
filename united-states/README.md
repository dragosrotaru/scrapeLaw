# Law Directory Scraper

The purpose of this code is to scrape all of the lawyer and law firm contact data from all of the public bar association and law society directories across the US, Canada and elsewhere.

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


## TODO 

- add more easy regions
- implement Michigan and Illinois
- implement CLI
- standardize filtering
- standardize caching / saving and add time / hash
- complete Florida run
- fix florida indexing
- complete Texas run
