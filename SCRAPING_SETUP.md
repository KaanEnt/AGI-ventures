# Event Scraping System

## Overview

This project now includes a complete event scraping system that fetches both **upcoming** and **past** events from your Luma calendar at `https://lu.ma/agivc`.

## What Was Added

### 1. Scraping Scripts (`/scripts`)

- **`scrape-luma.ts`**: Main scraper that fetches events from Luma
  - Scrapes both upcoming events (`/agivc`) and past events (`/agivc/past`)
  - Supports debug mode to save HTML and data structures
  - Handles various data structures that Luma might use

- **`auto-scraper.ts`**: Automated scraper with smart caching
  - Only scrapes if data is older than 23 hours
  - Perfect for cron jobs or scheduled tasks
  - Logs all activity with timestamps

- **`README.md`**: Documentation for the scripts

### 2. Updated Data Loading (`/lib`)

- **`loadScrapedEvents.ts`**: Enhanced with three functions
  - `loadScrapedEvents()`: Loads upcoming events (backwards compatible)
  - `loadPastEvents()`: Loads past events
  - `loadAllEvents()`: Loads both upcoming and past events

- **New data structure in `scraped-events.json`**:
  ```json
  {
    "scraped_at": "2025-10-02T12:00:00.000Z",
    "calendar_slug": "agivc",
    "upcoming_count": 4,
    "past_count": 10,
    "upcoming_events": [...],
    "past_events": [...],
    "events_count": 4,  // backwards compatibility
    "events": [...]      // backwards compatibility
  }
  ```

### 3. Enhanced Events Timeline Component

- **Past/Upcoming Toggle**: Users can now switch between viewing upcoming and past events
- **Smart Date Sorting**: 
  - Upcoming events: sorted from earliest to latest
  - Past events: sorted from latest to earliest
- **No Mock Dates for Past Events**: Only upcoming events show mock dates when there aren't enough real events

### 4. Package Scripts

Added convenient npm scripts:

```bash
npm run scrape         # Scrape events manually
npm run scrape:debug   # Scrape with debug output
npm run scrape:auto    # Smart auto-scraper (only if data is stale)
```

## Usage

### Manual Scraping

To scrape events right now:

```bash
npm run scrape
```

This will fetch all upcoming and past events and save them to `lib/scraped-events.json`.

### Debug Mode

If the scraper isn't finding events, run with debug mode:

```bash
npm run scrape:debug
```

This saves:
- `debug-luma-upcoming.html` - The HTML of the upcoming events page
- `debug-luma-past.html` - The HTML of the past events page
- `debug-pageprops-*.json` - The parsed data structures
- `debug-initialdata-*.json` - The detailed event data

### Automated Scraping

Set up a cron job to scrape daily:

```bash
# Linux/Mac - runs daily at 3 AM
0 3 * * * cd /path/to/project && npm run scrape:auto

# Windows Task Scheduler
# Create a task that runs: npm run scrape:auto
```

Or use it in your CI/CD pipeline before builds.

## How It Works

1. **Fetches Luma Pages**: The scraper visits `https://lu.ma/agivc` and `https://lu.ma/agivc/past`

2. **Parses Next.js Data**: Luma is built with Next.js, so it looks for the `__NEXT_DATA__` script tag

3. **Extracts Events**: Navigates through various possible data structures to find events

4. **Saves JSON**: Writes the structured data to `lib/scraped-events.json`

5. **UI Updates**: The Next.js app reads the JSON file and displays events

## UI Features

### Upcoming/Past Toggle

Users can click "Upcoming" or "Past" buttons to switch views:
- **Upcoming**: Shows future events + mock dates if needed
- **Past**: Shows historical events in reverse chronological order

### Backwards Compatibility

The system maintains the old data format, so if you have existing code using `eventsData.events`, it will still work.

## Troubleshooting

### No events found

1. Run with debug mode: `npm run scrape:debug`
2. Check the generated HTML and JSON files
3. The Luma page structure might have changed - update the scraper accordingly

### Old data showing

1. Delete `lib/scraped-events.json`
2. Run `npm run scrape` to fetch fresh data

### Scraper fails

- Check your internet connection
- Luma might be blocking automated requests (add delays if needed)
- The page structure might have changed

## Future Enhancements

Possible improvements:
- Add rate limiting to avoid being blocked
- Cache images locally
- Add event filtering (by type, date range, etc.)
- Real-time updates via webhooks
- Event search functionality

## Files Modified

- ✅ `scripts/scrape-luma.ts` - Main scraper (new)
- ✅ `scripts/auto-scraper.ts` - Auto scraper (new)
- ✅ `scripts/README.md` - Scripts documentation (new)
- ✅ `lib/loadScrapedEvents.ts` - Enhanced data loading
- ✅ `lib/types.ts` - Added pastEvents to props
- ✅ `components/events-timeline.tsx` - Added past events view
- ✅ `app/page.tsx` - Passes past events to timeline
- ✅ `package.json` - Added scripts and dependencies

## Testing

To test the complete system:

1. **Scrape fresh data**:
   ```bash
   npm run scrape
   ```

2. **Check the output**:
   ```bash
   cat lib/scraped-events.json
   ```

3. **Run the dev server**:
   ```bash
   npm run dev
   ```

4. **Test the UI**:
   - Visit http://localhost:3000
   - Click "Past" button to view historical events
   - Click "Upcoming" to go back

Enjoy your new event scraping system! 🎉

