import { Event } from './types';
import { readFileSync } from 'fs';
import { join } from 'path';

export function loadScrapedEvents(): Event[] {
  try {
    const filePath = join(process.cwd(), 'lib/scraped-events.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (data.events && Array.isArray(data.events)) {
      return data.events;
    }
  } catch (error) {
    console.log('No scraped events file found');
  }
  
  return [];
}

