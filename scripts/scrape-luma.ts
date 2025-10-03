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

async function scrapeLumaEvents(calendarSlug: string, eventType: 'upcoming' | 'past' = 'upcoming', debugMode = false): Promise<Event[]> {
  const urlPath = eventType === 'past' ? `${calendarSlug}/past` : calendarSlug;
  console.log(`[INFO] Scraping https://lu.ma/${urlPath}...`);
  
  try {
    const response = await fetch(`https://lu.ma/${urlPath}`, {
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
    const events: Event[] = [];

    // Debug: Log all script tags
    console.log(`[INFO] Found ${$('script').length} script tags`);
    
    // Look for Next.js data
    $('script[id="__NEXT_DATA__"]').each((_, element) => {
      try {
        console.log('[INFO] Found __NEXT_DATA__ script tag');
        const jsonData = JSON.parse($(element).html() || '{}');
        console.log('[INFO] Parsed Next.js data structure:', Object.keys(jsonData));
        
        // Navigate through Next.js data structure
        const pageProps = jsonData?.props?.pageProps;
        if (pageProps) {
          console.log('[INFO] PageProps keys:', Object.keys(pageProps));
          
          // Debug: Save the full data structure
          if (debugMode) {
            const dataPath = join(process.cwd(), `debug-pageprops-${eventType}.json`);
            writeFileSync(dataPath, JSON.stringify(pageProps, null, 2));
            console.log(`[DEBUG] Saved PageProps to ${dataPath}`);
          }
          
          // Explore initialData structure
          if (pageProps.initialData) {
            console.log('[INFO] InitialData keys:', Object.keys(pageProps.initialData));
            
            if (debugMode) {
              const initialDataPath = join(process.cwd(), `debug-initialdata-${eventType}.json`);
              writeFileSync(initialDataPath, JSON.stringify(pageProps.initialData, null, 2));
              console.log(`[DEBUG] Saved InitialData to ${initialDataPath}`);
            }
          }
          
          // Look for events in various locations
          const possibleEventSources = [
            pageProps.events,
            pageProps.calendar?.events,
            pageProps.initialData?.events,
            pageProps.initialData?.calendar?.events,
            pageProps.initialData?.data?.events,
            pageProps.initialData?.data?.featured_items, // Found it! Events are here
            pageProps.data?.events,
            pageProps.serverData?.events,
          ];

          for (const eventSource of possibleEventSources) {
            if (eventSource && Array.isArray(eventSource)) {
              console.log(`[SUCCESS] Found ${eventSource.length} events in data source`);
              eventSource.forEach((item: any, index: number) => {
                // Handle featured_items structure (has nested event object)
                const event = item.event || item;
                
                console.log(`Event ${index + 1}:`, {
                  id: event.api_id || event.id,
                  name: event.name,
                  start_at: event.start_at || event.startDate || item.start_at,
                  cover_url: event.cover_url || event.social_image_url || event.image
                });
                
                if (event && (event.api_id || event.id) && event.name) {
                  events.push({
                    id: event.api_id || event.id,
                    name: event.name,
                    start_at: event.start_at || event.startDate || item.start_at || new Date().toISOString(),
                    cover_url: event.cover_url || event.social_image_url || event.image || '/placeholder.jpg',
                    url: event.url ? `https://lu.ma/${event.url}` : `https://lu.ma/${event.api_id || event.id}`,
                  });
                }
              });
              break; // Use first valid source
            }
          }
        }
      } catch (e) {
        console.error('[ERROR] Error parsing __NEXT_DATA__:', e);
      }
    });

    // Fallback: Look for other JSON script tags
    if (events.length === 0) {
      console.log('[INFO] Trying other JSON script tags...');
      $('script[type="application/json"]').each((_, element) => {
        try {
          const jsonData = JSON.parse($(element).html() || '{}');
          console.log('[INFO] Found JSON script with keys:', Object.keys(jsonData));
        } catch (e) {
          // Skip invalid JSON
        }
      });
    }

    // Fallback: Look for structured data
    if (events.length === 0) {
      console.log('[INFO] Trying structured data...');
      $('script[type="application/ld+json"]').each((_, element) => {
        try {
          const structuredData = JSON.parse($(element).html() || '{}');
          console.log('[INFO] Found structured data:', structuredData['@type']);
          
          if (structuredData['@type'] === 'Event') {
            events.push({
              id: structuredData.identifier || Date.now().toString(),
              name: structuredData.name || 'Unnamed Event',
              start_at: structuredData.startDate || new Date().toISOString(),
              cover_url: structuredData.image || '/placeholder.jpg',
              url: structuredData.url || `https://lu.ma/${calendarSlug}`,
            });
          }
        } catch (e) {
          // Skip invalid JSON
        }
      });
    }

    console.log(`[SUCCESS] Successfully scraped ${events.length} ${eventType} events`);
    return events;

  } catch (error) {
    console.error('[ERROR] Scraping failed:', error);
    return [];
  }
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
  const scrapedUpcoming = await scrapeLumaEvents(calendarSlug, 'upcoming', debugMode);
  
  console.log('\n[INFO] Scraping past events...');
  const scrapedPast = await scrapeLumaEvents(calendarSlug, 'past', debugMode);
  
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

