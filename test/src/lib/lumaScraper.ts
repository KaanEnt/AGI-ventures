// Web scraping alternative for public Luma calendars
// This scrapes the public Luma page since the API requires calendar ownership

import * as cheerio from 'cheerio';
import { Event } from './types';

export async function scrapeLumaEvents(calendarSlug: string): Promise<Event[]> {
  try {
    const response = await fetch(`https://lu.ma/${calendarSlug}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Luma page: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const events: Event[] = [];

    // Look for event data in script tags (Luma embeds data as JSON)
    $('script[type="application/json"]').each((_, element) => {
      try {
        const jsonData = JSON.parse($(element).html() || '{}');
        
        // Luma stores events in featured_items within initialData
        const pageProps = jsonData?.props?.pageProps;
        const featuredItems = pageProps?.initialData?.data?.featured_items;

        if (featuredItems && Array.isArray(featuredItems)) {
          featuredItems.forEach((item: any) => {
            const event = item.event || item;
            if (event && event.api_id && event.name && event.start_at) {
              events.push({
                id: event.api_id,
                name: event.name,
                start_at: event.start_at,
                cover_url: event.cover_url || event.social_image_url || '/.specstory/references/Frame1468.png',
                url: `https://lu.ma/${event.url || event.api_id}`,
              });
            }
          });
        }
      } catch (e) {
        // Continue to next script tag if this one fails
      }
    });

    // Fallback: try to extract from meta tags or structured data
    if (events.length === 0) {
      $('script[type="application/ld+json"]').each((_, element) => {
        try {
          const structuredData = JSON.parse($(element).html() || '{}');
          if (structuredData['@type'] === 'Event' || structuredData.event) {
            const eventInfo = structuredData.event || structuredData;
            events.push({
              id: eventInfo.identifier || Date.now().toString(),
              name: eventInfo.name || 'Unnamed Event',
              start_at: eventInfo.startDate || new Date().toISOString(),
              cover_url: eventInfo.image || '/.specstory/references/Frame1468.png',
              url: eventInfo.url || `https://lu.ma/${calendarSlug}`,
            });
          }
        } catch (e) {
          // Continue if parsing fails
        }
      });
    }

    console.log(`Scraped ${events.length} events from Luma`);
    return events;

  } catch (error) {
    console.error('Failed to scrape Luma events:', error);
    return [];
  }
}

// Alternative: Use Luma's embed API (if available)
export async function fetchLumaEmbed(calendarSlug: string): Promise<Event[]> {
  try {
    // Try Luma's embed endpoint (sometimes publicly accessible)
    const response = await fetch(`https://lu.ma/embed/${calendarSlug}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.events?.map((event: any): Event => ({
        id: event.api_id,
        name: event.name,
        start_at: event.start_at,
        cover_url: event.cover_url || event.social_image_url,
        url: event.url,
      })) || [];
    }
  } catch (error) {
    console.log('Embed API not available, using scraper');
  }

  return scrapeLumaEvents(calendarSlug);
}
