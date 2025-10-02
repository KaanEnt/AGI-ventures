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
  events: any[];
}

function log(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function shouldScrape(): boolean {
  const scrapedFilePath = join(process.cwd(), 'src/lib/scraped-events.json');
  
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
    const scrapedFilePath = join(process.cwd(), 'src/lib/scraped-events.json');
    if (existsSync(scrapedFilePath)) {
      const data: ScrapedData = JSON.parse(readFileSync(scrapedFilePath, 'utf-8'));
      log(`✅ Successfully scraped ${data.events_count} events`);
      
      // Log the events found
      data.events.forEach((event, index) => {
        log(`   ${index + 1}. ${event.name} (${new Date(event.start_at).toLocaleDateString()})`);
      });
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
