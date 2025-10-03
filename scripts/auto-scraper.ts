#!/usr/bin/env tsx

// Auto-scraper that runs periodically
// Can be used with cron jobs or as a background service

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface ScrapedData {
  scraped_at: string;
  calendar_slug: string;
  events_count: number;
  upcoming_count?: number;
  past_count?: number;
  events: any[];
  upcoming_events?: any[];
  past_events?: any[];
}

function log(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function shouldScrape(): boolean {
  const scrapedFilePath = join(process.cwd(), 'lib/scraped-events.json');
  
  if (!existsSync(scrapedFilePath)) {
    log('📋 No scraped events file found - will scrape');
    return true;
  }

  try {
    const fileContent = readFileSync(scrapedFilePath, 'utf-8');
    const data: ScrapedData = JSON.parse(fileContent);
    const lastScraped = new Date(data.scraped_at);
    const now = new Date();
    const hoursSinceLastScrape = (now.getTime() - lastScraped.getTime()) / (1000 * 60 * 60);
    
    log(`📊 Last scraped: ${lastScraped.toLocaleString()}`);
    log(`⏰ Hours since last scrape: ${hoursSinceLastScrape.toFixed(1)}`);
    
    // Scrape if it's been more than 23 hours (daily)
    return hoursSinceLastScrape >= 23;
  } catch (error) {
    log('❌ Error reading scraped file - will scrape');
    return true;
  }
}

async function runScraper() {
  try {
    log('🚀 Starting automated scraper...');
    
    if (!shouldScrape()) {
      log('✅ Events are up to date, skipping scrape');
      return;
    }

    log('🔍 Running scraper...');
    const output = execSync('npx tsx scripts/scrape-luma.ts agivc', { 
      encoding: 'utf-8',
      cwd: process.cwd()
    });
    
    log('📋 Scraper output:');
    console.log(output);
    
    // Verify the scrape was successful
    const scrapedFilePath = join(process.cwd(), 'lib/scraped-events.json');
    if (existsSync(scrapedFilePath)) {
      const data: ScrapedData = JSON.parse(readFileSync(scrapedFilePath, 'utf-8'));
      const upcomingCount = data.upcoming_count || data.events_count;
      const pastCount = data.past_count || 0;
      log(`✅ Successfully scraped ${upcomingCount} upcoming and ${pastCount} past events`);
      
      // Log the upcoming events found
      const upcomingEvents = data.upcoming_events || data.events;
      if (upcomingEvents && upcomingEvents.length > 0) {
        log('📋 Upcoming events:');
        upcomingEvents.forEach((event, index) => {
          log(`   ${index + 1}. ${event.name} (${new Date(event.start_at).toLocaleDateString()})`);
        });
      }
      
      // Log some past events
      if (data.past_events && data.past_events.length > 0) {
        log(`📚 Past events: ${data.past_events.length} total`);
      }
    }
    
  } catch (error) {
    log(`❌ Scraper failed: ${error}`);
  }
}

// Run immediately if called directly
if (require.main === module) {
  runScraper().then(() => {
    log('🏁 Auto-scraper completed');
    process.exit(0);
  }).catch((error) => {
    log(`💥 Auto-scraper crashed: ${error}`);
    process.exit(1);
  });
}

export { runScraper };

