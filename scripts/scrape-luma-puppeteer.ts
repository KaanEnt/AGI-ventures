#!/usr/bin/env tsx

// Puppeteer-based Luma scraper with infinite scroll support
// Run with: npx tsx scripts/scrape-luma-puppeteer.ts

import puppeteer from 'puppeteer';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface Event {
  id: string;
  name: string;
  start_at: string;
  cover_url: string;
  url?: string;
}

async function scrapeLumaEventsPuppeteer(
  calendarSlug: string,
  eventType: 'upcoming' | 'past' = 'upcoming',
  maxEvents = 20
): Promise<Event[]> {
  const url = eventType === 'past'
    ? `https://lu.ma/${calendarSlug}?k=c&period=past`
    : `https://lu.ma/${calendarSlug}`;

  console.log(`[PUPPETEER] Launching browser for ${url}...`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log(`[PUPPETEER] Navigating to ${url}...`);
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch (error: any) {
      if (error.name === 'TimeoutError') {
        console.log(`[PUPPETEER] Navigation timeout, but page may have loaded content...`);
      } else {
        throw error;
      }
    }

    console.log(`[PUPPETEER] Page loaded, waiting for content to render...`);
    
    // Wait for content to render - try multiple selectors
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Scroll and load more events
    const scrollAttempts = 5; // Scroll 5 times to load more events
    for (let i = 0; i < scrollAttempts; i++) {
      console.log(`[PUPPETEER] Scroll attempt ${i + 1}/${scrollAttempts}...`);
      
      // Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Wait for new content to load
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`[PUPPETEER] Extracting event data from DOM...`);

    // Extract events from the DOM - try multiple selectors
    const events = await page.evaluate(() => {
      const extractedEvents: any[] = [];

      // Try multiple selectors for event cards
      const selectors = [
        '.timeline-section',
        '[class*="event-card"]',
        '[class*="EventCard"]',
        'a[href*="/"]'
      ];

      // Find all event links - specifically look for timeline sections with event links
      const timelineSections = document.querySelectorAll('.timeline-section');
      
      timelineSections.forEach((section) => {
        // Skip skeleton loaders
        if (section.querySelector('.shimmer-wrapper') || 
            section.classList.contains('shimmer-wrapper')) return;

        // Find event link within this section
        const eventLink = section.querySelector('a[href^="/"]');
        if (!eventLink) return;

        const href = eventLink.getAttribute('href');
        if (!href || href === '/' || href.length < 3) return;

        // Skip certain non-event links
        const skipPatterns = ['explore', 'agivc', 'mapbox', 'openstreetmap', 'terms', 'privacy'];
        const shouldSkip = skipPatterns.some(pattern => href.toLowerCase().includes(pattern));
        if (shouldSkip) return;

        // Extract event name from h3
        const nameElement = section.querySelector('h3');
        const name = nameElement?.textContent?.trim();
        
        if (!name || name.length < 3) return;

        // Make sure the name is not a navigation element
        if (name.toLowerCase().includes('explore') || 
            name.toLowerCase().includes('mapbox') || 
            name.toLowerCase().includes('©')) return;

        // Extract cover image
        const imgElement = section.querySelector('img[alt*="Cover"]') || 
                          section.querySelector('img');
        const coverUrl = imgElement?.getAttribute('src') || imgElement?.getAttribute('data-src');

        // Extract event ID from href
        const eventId = href.replace('/', '');

        extractedEvents.push({
          id: eventId,
          name,
          start_at: new Date().toISOString(), // Will be enriched later
          cover_url: coverUrl || '/placeholder.jpg',
          url: `https://lu.ma${href}`,
        });
      });

      // Remove duplicates by ID
      const uniqueEvents = Array.from(
        new Map(extractedEvents.map(e => [e.id, e])).values()
      );

      return uniqueEvents;
    });

    console.log(`[PUPPETEER] Found ${events.length} events in DOM`);

    // Now try to match with data from __NEXT_DATA__ for accurate timestamps and additional data
    const nextData = await page.evaluate(() => {
      const scriptTag = document.getElementById('__NEXT_DATA__');
      if (!scriptTag) return null;
      try {
        return JSON.parse(scriptTag.textContent || '{}');
      } catch {
        return null;
      }
    });

    // Enrich events with data from __NEXT_DATA__
    const enrichedEvents: Event[] = [];
    
    // Create a comprehensive event data map from all available sources
    const eventDataMap = new Map();
    
    if (nextData?.props?.pageProps?.initialData?.data) {
      const data = nextData.props.pageProps.initialData.data;
      
      // Process featured_items
      if (data.featured_items) {
        data.featured_items.forEach((item: any) => {
          const event = item.event || item;
          if (event.url) {
            eventDataMap.set(event.url, {
              id: event.api_id || event.url,
              name: event.name,
              start_at: event.start_at,
              cover_url: event.cover_url || event.social_image_url,
            });
          }
        });
      }

      // Also check for event_start_ats and items arrays
      if (data.items) {
        data.items.forEach((item: any) => {
          const event = item.event || item;
          if (event.url) {
            eventDataMap.set(event.url, {
              id: event.api_id || event.url,
              name: event.name,
              start_at: event.start_at,
              cover_url: event.cover_url || event.social_image_url,
            });
          }
        });
      }
    }

    console.log(`[PUPPETEER] Found ${eventDataMap.size} events with full data from JSON`);

    // Debug: Save the full __NEXT_DATA__ structure
    if (process.argv.includes('--debug') && nextData) {
      const debugPath = join(process.cwd(), `debug-nextdata-${eventType}.json`);
      writeFileSync(debugPath, JSON.stringify(nextData, null, 2));
      console.log(`[DEBUG] Saved full __NEXT_DATA__ to ${debugPath}`);
    }

    // Match DOM events with JSON data
    events.forEach((domEvent: any) => {
      const eventSlug = domEvent.id;
      const jsonData = eventDataMap.get(eventSlug);

      if (jsonData && jsonData.start_at) {
        // Use JSON data (has accurate timestamps)
        enrichedEvents.push({
          id: jsonData.id,
          name: jsonData.name,
          start_at: jsonData.start_at,
          cover_url: jsonData.cover_url || domEvent.cover_url,
          url: domEvent.url,
        });
      }
      // Skip events without proper timestamp data
    });

    console.log(`[PUPPETEER] Successfully enriched ${enrichedEvents.length} of ${events.length} DOM events with timestamp data`);

    // If we have many DOM events but few enriched, use the event_start_ats from JSON to estimate dates
    if (enrichedEvents.length < Math.min(events.length / 2, maxEvents) && events.length > 5) {
      console.log(`[PUPPETEER] Attempting to match events with timestamps from calendar data...`);
      
      // Get event_start_ats array from the JSON
      const eventStartDates: string[] = [];
      if (nextData?.props?.pageProps?.initialData?.data?.event_start_ats) {
        eventStartDates.push(...nextData.props.pageProps.initialData.data.event_start_ats);
      }
      
      console.log(`[PUPPETEER] Found ${eventStartDates.length} timestamps in calendar data`);
      
      if (eventStartDates.length > 0) {
        // For past events, use the timestamps we have
        // Sort timestamps in descending order for past events
        const sortedDates = [...eventStartDates].sort((a, b) => 
          new Date(b).getTime() - new Date(a).getTime()
        );
        
        const unenrichedEvents = events.filter(e => !enrichedEvents.some(ee => ee.id === e.id));
        const eventsToEnrich = unenrichedEvents.slice(0, Math.min(maxEvents - enrichedEvents.length, sortedDates.length));
        
        eventsToEnrich.forEach((event, index) => {
          if (index < sortedDates.length) {
            enrichedEvents.push({
              id: event.id,
              name: event.name,
              start_at: sortedDates[index],
              cover_url: event.cover_url,
              url: event.url,
            });
          }
        });
        
        console.log(`[PUPPETEER] Enriched ${eventsToEnrich.length} additional events using calendar timestamps`);
      }
    }

    return enrichedEvents.slice(0, maxEvents);
  } finally {
    await browser.close();
    console.log(`[PUPPETEER] Browser closed`);
  }
}

async function main() {
  const calendarSlug = process.argv[2] || 'agivc';
  console.log(`[START] Starting Puppeteer scraper for: ${calendarSlug}`);

  const now = new Date();

  // Scrape both upcoming and past events
  console.log('\n[INFO] Scraping upcoming events...');
  const scrapedUpcoming = await scrapeLumaEventsPuppeteer(calendarSlug, 'upcoming', 50);

  console.log('\n[INFO] Scraping past events (up to 20)...');
  const scrapedPast = await scrapeLumaEventsPuppeteer(calendarSlug, 'past', 20);

  // Filter out events that aren't actually in the past/future
  const upcomingEvents = scrapedUpcoming.filter((event) => {
    const eventDate = new Date(event.start_at);
    return eventDate > now;
  });

  let pastEvents = scrapedPast.filter((event) => {
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

  // Filter existing past events to remove any that are now upcoming
  existingPastEvents = existingPastEvents.filter((event) => {
    const eventDate = new Date(event.start_at);
    return eventDate <= now;
  });

  // Merge past events, avoiding duplicates
  const existingIds = new Set(existingPastEvents.map((e) => e.id));
  const newPastEvents = pastEvents.filter((event) => !existingIds.has(event.id));

  // Combine and sort past events (newest first)
  const allPastEvents = [...newPastEvents, ...existingPastEvents]
    .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime())
    .slice(0, 20); // Limit to 20 most recent past events

  console.log(`\n[INFO] Found ${newPastEvents.length} new past events, ${existingPastEvents.length} existing`);
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
    events: upcomingEvents,
  };

  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n[SAVED] Saved ${upcomingEvents.length} upcoming and ${allPastEvents.length} past events to ${outputPath}`);

  if (upcomingEvents.length > 0) {
    console.log('\n[RESULTS] Upcoming events found:');
    upcomingEvents.slice(0, 5).forEach((event, index) => {
      const eventDate = new Date(event.start_at);
      console.log(`${index + 1}. ${event.name} (${eventDate.toLocaleString()})`);
    });
    if (upcomingEvents.length > 5) {
      console.log(`... and ${upcomingEvents.length - 5} more`);
    }
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

main().catch((error) => {
  console.error('[ERROR] Scraper failed:', error);
  process.exit(1);
});

