# Event Scraping Scripts

This directory contains scripts for scraping events from Luma.

## Setup

First, install the dependencies:

```bash
npm install
# or
pnpm install
```

## Scripts

### Manual Scraping

Scrape events manually:

```bash
npm run scrape
```

Scrape with debug mode (saves HTML and data structures):

```bash
npm run scrape:debug
```

### Automated Scraping

Run the auto-scraper (checks if data is older than 23 hours before scraping):

```bash
npm run scrape:auto
```

**Note:** The scraper does NOT run automatically. You need to set it up as a cron job or scheduled task to run daily.

Example cron job setup:

```bash
# Add to crontab (runs daily at 3 AM)
0 3 * * * cd /path/to/project && npm run scrape:auto
```

## Files

- `scrape-luma.ts` - Main scraper that fetches upcoming and past events from Luma
- `auto-scraper.ts` - Automated scraper that only runs if data is stale (23+ hours old)

## Output

The scraped data is saved to `lib/scraped-events.json` with the following structure:

```json
{
  "scraped_at": "2025-10-02T12:00:00.000Z",
  "calendar_slug": "agivc",
  "upcoming_count": 4,
  "past_count": 10,
  "upcoming_events": [...],
  "past_events": [...],
  "events_count": 4,
  "events": [...]
}
```

The `events` and `events_count` fields are maintained for backwards compatibility.
