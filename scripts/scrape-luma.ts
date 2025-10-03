#!/usr/bin/env tsx

// Standalone Luma scraper script
// Run with: npx tsx scripts/scrape-luma.ts

import * as cheerio from 'cheerio';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface Event {
  id: string;
  name: string;
  start_at: string;
  cover_url: string;
  url?: string;
}

async function scrapeLumaEvents(calendarSlug: string, eventType: 'upcoming' | 'past' = 'upcoming', debugMode = false, maxEvents = 20): Promise<Event[]> {
  const allEvents: Event[] = [];
  let pagination_cursor: string | null = null;
  let attemptCount = 0;
  const maxAttempts = 3; // Limit to 3 pages to avoid infinite loops
  
  while (allEvents.length < maxEvents && attemptCount < maxAttempts) {
    attemptCount++;
    
    // Build URL with pagination
    let url = eventType === 'past' 
      ? `https://lu.ma/${calendarSlug}?k=c&period=past` 
      : `https://lu.ma/${calendarSlug}`;
    
    if (pagination_cursor) {
      url += `&pagination_cursor=${pagination_cursor}`;
    }
    
    console.log(`[INFO] Scraping ${url}... (attempt ${attemptCount})`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`[INFO] Received ${html.length} characters of HTML`);
    
    // Save HTML for debugging if requested
    if (debugMode) {
      const htmlPath = join(process.cwd(), `debug-luma-${eventType}.html`);
      writeFileSync(htmlPath, html);
      console.log(`[DEBUG] Saved HTML to ${htmlPath}`);
    }
    
    const $ = cheerio.load(html);
    const pageEvents: Event[] = [];
    let nextCursor: string | null = null;

    // Debug: Log all script tags
    if (attemptCount === 1) {
      console.log(`[INFO] Found ${$('script').length} script tags`);
    }
    
    // Look for Next.js data
    $('script[id="__NEXT_DATA__"]').each((_, element) => {
      try {
        if (attemptCount === 1) {
          console.log('[INFO] Found __NEXT_DATA__ script tag');
        }
        const jsonData = JSON.parse($(element).html() || '{}');
        
        // Navigate through Next.js data structure
        const pageProps = jsonData?.props?.pageProps;
        if (pageProps) {
          if (attemptCount === 1 && debugMode) {
            console.log('[INFO] PageProps keys:', Object.keys(pageProps));
            const dataPath = join(process.cwd(), `debug-pageprops-${eventType}.json`);
            writeFileSync(dataPath, JSON.stringify(pageProps, null, 2));
            console.log(`[DEBUG] Saved PageProps to ${dataPath}`);
          }
          
          // Check for pagination cursor
          if (pageProps.initialData?.data?.pagination_cursor) {
            nextCursor = pageProps.initialData.data.pagination_cursor;
          }
          
          // Look for events in various locations
          const possibleEventSources = [
            pageProps.events,
            pageProps.calendar?.events,
            pageProps.initialData?.events,
            pageProps.initialData?.calendar?.events,
            pageProps.initialData?.data?.events,
            pageProps.initialData?.data?.featured_items,
            pageProps.data?.events,
            pageProps.serverData?.events,
          ];

          for (const eventSource of possibleEventSources) {
            if (eventSource && Array.isArray(eventSource)) {
              console.log(`[SUCCESS] Found ${eventSource.length} events in page ${attemptCount}`);
              eventSource.forEach((item: any) => {
                const event = item.event || item;
                
                if (event && (event.api_id || event.id) && event.name) {
                  pageEvents.push({
                    id: event.api_id || event.id,
                    name: event.name,
                    start_at: event.start_at || event.startDate || item.start_at || new Date().toISOString(),
                    cover_url: event.cover_url || event.social_image_url || event.image || '/placeholder.jpg',
                    url: event.url ? `https://lu.ma/${event.url}` : `https://lu.ma/${event.api_id || event.id}`,
                  });
                }
              });
              break;
            }
          }
        }
      } catch (e) {
        console.error('[ERROR] Error parsing __NEXT_DATA__:', e);
      }
    });

    // Add page events to collection
    allEvents.push(...pageEvents);
    console.log(`[INFO] Total events collected so far: ${allEvents.length}`);
    
    // Check if we should continue paginating
    if (!nextCursor || pageEvents.length === 0) {
      console.log('[INFO] No more pages to fetch');
      break;
    }
    
    pagination_cursor = nextCursor;
    
    // Add a small delay to avoid rate limiting
    if (attemptCount < maxAttempts && allEvents.length < maxEvents) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

  } catch (error) {
    console.error('[ERROR] Scraping failed on attempt', attemptCount, ':', error);
    break;
  }
  }

  console.log(`[SUCCESS] Successfully scraped ${allEvents.length} ${eventType} events total`);
  return allEvents.slice(0, maxEvents); // Limit to requested max
}

async function main() {
  const calendarSlug = process.argv[2] || 'agivc';
  const debugMode = process.argv.includes('--debug');
  console.log(`[START] Starting Luma scraper for: ${calendarSlug}`);
  
  if (debugMode) {
    console.log('[DEBUG] Debug mode enabled - will save HTML and data structures');
  }
  
  const now = new Date();
  
  // Scrape both upcoming and past events
  console.log('\n[INFO] Scraping upcoming events...');
  const scrapedUpcoming = await scrapeLumaEvents(calendarSlug, 'upcoming', debugMode, 50);
  
  console.log('\n[INFO] Scraping past events (up to 20)...');
  const scrapedPast = await scrapeLumaEvents(calendarSlug, 'past', debugMode, 20);
  
  // Filter out events that aren't actually in the past/future
  const upcomingEvents = scrapedUpcoming.filter(event => {
    const eventDate = new Date(event.start_at);
    return eventDate > now;
  });
  
  const pastEvents = scrapedPast.filter(event => {
    const eventDate = new Date(event.start_at);
    return eventDate <= now;
  });
  
  // Load existing data to avoid duplicates
  const outputPath = join(process.cwd(), 'lib/scraped-events.json');
  let existingPastEvents: Event[] = [];
  
  try {
    if (existsSync(outputPath)) {
      const existingData = JSON.parse(readFileSync(outputPath, 'utf-8'));
      existingPastEvents = existingData.past_events || [];
    }
  } catch (e) {
    console.log('[INFO] No existing data found, starting fresh');
  }
  
  // Merge past events, avoiding duplicates
  const existingIds = new Set(existingPastEvents.map(e => e.id));
  const newPastEvents = pastEvents.filter(event => !existingIds.has(event.id));
  
  // Combine and sort past events (newest first)
  const allPastEvents = [...newPastEvents, ...existingPastEvents]
    .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime())
    .slice(0, 20); // Limit to 20 most recent past events
  
  console.log(`[INFO] Found ${newPastEvents.length} new past events, ${existingPastEvents.length} existing`);
  console.log(`[INFO] Total past events after merge: ${allPastEvents.length} (limited to 20)`);
  
  // Save to JSON file
  const output = {
    scraped_at: new Date().toISOString(),
    calendar_slug: calendarSlug,
    upcoming_count: upcomingEvents.length,
    past_count: allPastEvents.length,
    upcoming_events: upcomingEvents,
    past_events: allPastEvents,
    // Backwards compatibility
    events_count: upcomingEvents.length,
    events: upcomingEvents
  };
  
  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n[SAVED] Saved ${upcomingEvents.length} upcoming and ${allPastEvents.length} past events to ${outputPath}`);
  
  if (upcomingEvents.length > 0) {
    console.log('\n[RESULTS] Upcoming events found:');
    upcomingEvents.forEach((event, index) => {
      const eventDate = new Date(event.start_at);
      console.log(`${index + 1}. ${event.name} (${eventDate.toLocaleString()})`);
    });
  }
  
  if (allPastEvents.length > 0) {
    console.log('\n[RESULTS] Past events (showing first 5):');
    allPastEvents.slice(0, 5).forEach((event, index) => {
      const eventDate = new Date(event.start_at);
      console.log(`${index + 1}. ${event.name} (${eventDate.toLocaleString()})`);
    });
    if (allPastEvents.length > 5) {
      console.log(`... and ${allPastEvents.length - 5} more`);
    }
  }
  
  if (upcomingEvents.length === 0 && allPastEvents.length === 0) {
    console.log('\n[WARNING] No events found. The page structure might have changed.');
  }
  
  console.log(`\n[SUMMARY] Upcoming: ${upcomingEvents.length}, Past: ${allPastEvents.length}, New Past: ${newPastEvents.length}`);
}

main().catch(console.error);

