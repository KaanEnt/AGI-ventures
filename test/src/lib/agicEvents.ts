// Manual backup events for AGIVC - update this periodically
// Use this as fallback when scraping fails

import { Event } from './types';

export const agicBackupEvents: Event[] = [
  {
    id: 'productivity-agent-build-day',
    name: 'Productivity Agent Build Day',
    start_at: '2025-09-20T17:00:00Z', // Sept 20, 2025 - Saturday
    cover_url: '/Frame1471.png', // Productivity Agent image
    url: 'https://lu.ma/agivc'
  },
  {
    id: 'web-agent-build-day',
    name: 'Web Agent Build Day', 
    start_at: '2025-09-27T17:00:00Z', // Sept 27, 2025 - Saturday
    cover_url: '/Frame1472.png', // Web Agent image
    url: 'https://lu.ma/agivc'
  },
  {
    id: 'small-language-model-build-day',
    name: 'Small Language Model Build Day',
    start_at: '2025-10-04T17:00:00Z', // Oct 4, 2025 - Saturday  
    cover_url: '/Frame1468.png', // Small Language Model image
    url: 'https://lu.ma/agivc'
  }
];

// Function to get events with multiple fallbacks
export async function getAGIVCEvents(): Promise<Event[]> {
  // First try to load from scraped JSON file (if exists)
  try {
    const { loadScrapedEvents } = await import('./loadScrapedEvents');
    const scrapedEvents = loadScrapedEvents();
    if (scrapedEvents.length > 0) {
      return scrapedEvents;
    }
  } catch (error) {
    console.log('📋 No scraped events available, trying live scraping...');
  }

  // Then try live scraping
  try {
    console.log('🔍 Attempting to scrape events from lu.ma/agivc...');
    const { fetchLumaEmbed } = await import('./lumaScraper');
    const scrapedEvents = await fetchLumaEmbed('agivc');
    
    if (scrapedEvents.length > 0) {
      console.log(`✅ Successfully scraped ${scrapedEvents.length} events from Luma`);
      return scrapedEvents;
    } else {
      console.log('⚠️ No events found via scraping, trying backup events');
    }
  } catch (error) {
    console.warn('❌ Scraping failed, using backup events:', error);
  }

  // Fallback to manual backup events
  console.log('📋 Using backup AGIVC events');
  return agicBackupEvents;
}
