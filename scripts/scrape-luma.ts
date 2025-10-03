#!/usr/bin/env tsx

// Standalone Luma scraper script
// Run with: npx tsx scripts/scrape-luma.ts

import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
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
  console.log(`🔍 Scraping https://lu.ma/${urlPath}...`);
  
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
    console.log(`📄 Received ${html.length} characters of HTML`);
    
    // Save HTML for debugging if requested
    if (debugMode) {
      const htmlPath = join(process.cwd(), `debug-luma-${eventType}.html`);
      writeFileSync(htmlPath, html);
      console.log(`🐛 Saved HTML to ${htmlPath}`);
    }
    
    const $ = cheerio.load(html);
    const events: Event[] = [];

    // Debug: Log all script tags
    console.log(`🔍 Found ${$('script').length} script tags`);
    
    // Look for Next.js data
    $('script[id="__NEXT_DATA__"]').each((_, element) => {
      try {
        console.log('🎯 Found __NEXT_DATA__ script tag');
        const jsonData = JSON.parse($(element).html() || '{}');
        console.log('📊 Parsed Next.js data structure:', Object.keys(jsonData));
        
        // Navigate through Next.js data structure
        const pageProps = jsonData?.props?.pageProps;
        if (pageProps) {
          console.log('📋 PageProps keys:', Object.keys(pageProps));
          
          // Debug: Save the full data structure
          if (debugMode) {
            const dataPath = join(process.cwd(), `debug-pageprops-${eventType}.json`);
            writeFileSync(dataPath, JSON.stringify(pageProps, null, 2));
            console.log(`🐛 Saved PageProps to ${dataPath}`);
          }
          
          // Explore initialData structure
          if (pageProps.initialData) {
            console.log('🔍 InitialData keys:', Object.keys(pageProps.initialData));
            
            if (debugMode) {
              const initialDataPath = join(process.cwd(), `debug-initialdata-${eventType}.json`);
              writeFileSync(initialDataPath, JSON.stringify(pageProps.initialData, null, 2));
              console.log(`🐛 Saved InitialData to ${initialDataPath}`);
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
              console.log(`✅ Found ${eventSource.length} events in data source`);
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
        console.error('❌ Error parsing __NEXT_DATA__:', e);
      }
    });

    // Fallback: Look for other JSON script tags
    if (events.length === 0) {
      console.log('🔄 Trying other JSON script tags...');
      $('script[type="application/json"]').each((_, element) => {
        try {
          const jsonData = JSON.parse($(element).html() || '{}');
          console.log('📊 Found JSON script with keys:', Object.keys(jsonData));
        } catch (e) {
          // Skip invalid JSON
        }
      });
    }

    // Fallback: Look for structured data
    if (events.length === 0) {
      console.log('🔄 Trying structured data...');
      $('script[type="application/ld+json"]').each((_, element) => {
        try {
          const structuredData = JSON.parse($(element).html() || '{}');
          console.log('📊 Found structured data:', structuredData['@type']);
          
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

    console.log(`✅ Successfully scraped ${events.length} ${eventType} events`);
    return events;

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    return [];
  }
}

async function main() {
  const calendarSlug = process.argv[2] || 'agivc';
  const debugMode = process.argv.includes('--debug');
  console.log(`🚀 Starting Luma scraper for: ${calendarSlug}`);
  
  if (debugMode) {
    console.log('🐛 Debug mode enabled - will save HTML and data structures');
  }
  
  // Scrape both upcoming and past events
  console.log('\n📅 Scraping upcoming events...');
  const upcomingEvents = await scrapeLumaEvents(calendarSlug, 'upcoming', debugMode);
  
  console.log('\n📚 Scraping past events...');
  const pastEvents = await scrapeLumaEvents(calendarSlug, 'past', debugMode);
  
  // Save to JSON file
  const outputPath = join(process.cwd(), 'lib/scraped-events.json');
  const output = {
    scraped_at: new Date().toISOString(),
    calendar_slug: calendarSlug,
    upcoming_count: upcomingEvents.length,
    past_count: pastEvents.length,
    upcoming_events: upcomingEvents,
    past_events: pastEvents,
    // Backwards compatibility
    events_count: upcomingEvents.length,
    events: upcomingEvents
  };
  
  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n💾 Saved ${upcomingEvents.length} upcoming and ${pastEvents.length} past events to ${outputPath}`);
  
  if (upcomingEvents.length > 0) {
    console.log('\n📋 Upcoming events found:');
    upcomingEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.name} (${event.start_at})`);
    });
  }
  
  if (pastEvents.length > 0) {
    console.log('\n📚 Past events found:');
    pastEvents.slice(0, 5).forEach((event, index) => {
      console.log(`${index + 1}. ${event.name} (${event.start_at})`);
    });
    if (pastEvents.length > 5) {
      console.log(`... and ${pastEvents.length - 5} more`);
    }
  }
  
  if (upcomingEvents.length === 0 && pastEvents.length === 0) {
    console.log('\n⚠️ No events found. The page structure might have changed.');
  }
}

main().catch(console.error);

