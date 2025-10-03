import { Event } from './types';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface ScrapedEventsData {
  scraped_at: string;
  calendar_slug: string;
  upcoming_count: number;
  past_count: number;
  upcoming_events: Event[];
  past_events: Event[];
  // Backwards compatibility
  events_count: number;
  events: Event[];
}

export function loadScrapedEvents(): Event[] {
  try {
    const filePath = join(process.cwd(), 'lib/scraped-events.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Support new format with upcoming_events
    if (data.upcoming_events && Array.isArray(data.upcoming_events)) {
      return data.upcoming_events;
    }
    
    // Fallback to old format
    if (data.events && Array.isArray(data.events)) {
      return data.events;
    }
  } catch (error) {
    console.log('No scraped events file found');
  }
  
  return [];
}

export function loadPastEvents(): Event[] {
  try {
    const filePath = join(process.cwd(), 'lib/scraped-events.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (data.past_events && Array.isArray(data.past_events)) {
      return data.past_events;
    }
  } catch (error) {
    console.log('No scraped events file found');
  }
  
  return [];
}

export function loadAllEvents(): { upcoming: Event[], past: Event[] } {
  return {
    upcoming: loadScrapedEvents(),
    past: loadPastEvents()
  };
}

