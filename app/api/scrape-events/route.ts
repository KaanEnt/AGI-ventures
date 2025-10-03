import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface Event {
  id: string;
  name: string;
  start_at: string;
  cover_url: string;
  url?: string;
}

async function scrapeLumaEvents(calendarSlug: string, eventType: 'upcoming' | 'past' = 'upcoming'): Promise<Event[]> {
  const urlPath = eventType === 'past' ? `${calendarSlug}/past` : calendarSlug;
  
  try {
    const response = await fetch(`https://lu.ma/${urlPath}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      next: { revalidate: 0 } // Don't cache
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const events: Event[] = [];

    $('script[id="__NEXT_DATA__"]').each((_, element) => {
      try {
        const jsonData = JSON.parse($(element).html() || '{}');
        const pageProps = jsonData?.props?.pageProps;
        
        if (pageProps) {
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
              eventSource.forEach((item: any) => {
                const event = item.event || item;
                
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
              break;
            }
          }
        }
      } catch (e) {
        console.error('[ERROR] Error parsing __NEXT_DATA__:', e);
      }
    });

    return events;
  } catch (error) {
    console.error('[ERROR] Scraping failed:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron or has the correct auth token
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[START] Starting event scraper...');
    
    const calendarSlug = 'agivc';
    const now = new Date();
    
    // Scrape both upcoming and past events
    const [scrapedUpcoming, scrapedPast] = await Promise.all([
      scrapeLumaEvents(calendarSlug, 'upcoming'),
      scrapeLumaEvents(calendarSlug, 'past')
    ]);

    // Filter out events that aren't actually in the past/future
    const upcomingEvents = scrapedUpcoming.filter(event => {
      const eventDate = new Date(event.start_at);
      return eventDate > now;
    });
    
    const pastEvents = scrapedPast.filter(event => {
      const eventDate = new Date(event.start_at);
      return eventDate <= now;
    });

    // Note: In serverless environment, we can't read existing files
    // You'd need to fetch from KV/database to merge with existing past events
    // For now, we'll just limit to 20
    const limitedPastEvents = pastEvents
      .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime())
      .slice(0, 20);

    const scrapedData = {
      scraped_at: new Date().toISOString(),
      calendar_slug: calendarSlug,
      upcoming_count: upcomingEvents.length,
      past_count: limitedPastEvents.length,
      upcoming_events: upcomingEvents,
      past_events: limitedPastEvents,
      events_count: upcomingEvents.length,
      events: upcomingEvents
    };

    console.log(`[SUCCESS] Scraped ${upcomingEvents.length} upcoming and ${limitedPastEvents.length} past events`);

    // In production, you would save this to:
    // 1. Vercel KV (Redis) - RECOMMENDED
    // 2. Vercel Postgres
    // 3. External database
    // 4. Or commit to GitHub and trigger a rebuild
    
    // For now, we'll just return it
    // You'll need to implement storage based on your preference
    
    return NextResponse.json({
      success: true,
      data: scrapedData,
      message: 'Events scraped successfully. Note: Data is not persisted in this demo. Implement Vercel KV for persistence.'
    });
    
  } catch (error) {
    console.error('[ERROR] Scraping failed:', error);
    return NextResponse.json(
      { error: 'Failed to scrape events', details: String(error) },
      { status: 500 }
    );
  }
}

// Allow manual triggers via POST
export async function POST(request: NextRequest) {
  return GET(request);
}

