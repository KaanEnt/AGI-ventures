// Load events from scraped JSON file
import { Event } from './types';
import { readFileSync } from 'fs';
import { join } from 'path';

export function loadScrapedEvents(): Event[] {
  try {
    const filePath = join(process.cwd(), 'src/lib/scraped-events.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (data.events && Array.isArray(data.events)) {
      console.log(`📋 Loaded ${data.events.length} events from scraped data (${data.scraped_at})`);
      return data.events;
    }
  } catch (error) {
    console.log('📋 No scraped events file found, using backup events');
  }
  
  return [];
}
