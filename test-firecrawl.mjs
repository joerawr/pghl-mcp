#!/usr/bin/env node
/**
 * Test if Firecrawl v2 can scrape the PGHL schedule page
 * Requires FIRECRAWL_API_KEY environment variable
 *
 * Uses Firecrawl v2 API with actions for JavaScript rendering
 * Docs: https://docs.firecrawl.dev/api-reference/endpoint/scrape
 */

import fs from 'fs';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
// Test with just season_id (all divisions) instead of filtering to one division
const PGHL_URL = 'https://www.pacificgirlshockey.com/stats#/1447/schedule?season_id=9486';

async function testFirecrawl() {
  if (!FIRECRAWL_API_KEY) {
    console.error('❌ FIRECRAWL_API_KEY environment variable is required');
    console.error('   Set it with: export FIRECRAWL_API_KEY=your_key_here');
    console.error('   Get one at: https://www.firecrawl.dev/');
    process.exit(1);
  }

  console.log('🔥 Testing Firecrawl v2 with PGHL schedule page');
  console.log('📍 URL:', PGHL_URL);
  console.log();

  try {
    console.log('⏳ Scraping with Firecrawl v2 (waiting for Angular to render)...');

    // Use Firecrawl v2 API with actions for JavaScript rendering
    // Try stealth mode with longer waits to bypass aggressive bot detection
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url: PGHL_URL,
        formats: ['html', 'markdown'],
        onlyMainContent: false, // Get full page including selects and tables
        actions: [
          // Wait for Angular to bootstrap
          { type: 'wait', milliseconds: 5000 },
          // Wait for Angular HTTP requests to complete (increased to 15 seconds)
          { type: 'wait', milliseconds: 15000 },
        ],
        // Try premium stealth mode for aggressive bot detection
        // WARNING: Uses more credits per request
        mobile: false,
        skipTlsVerification: false,
        timeout: 60000, // Increase timeout to 60 seconds
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Firecrawl API error:', response.status, response.statusText);
      console.error('   Response:', errorText);
      process.exit(1);
    }

    const result = await response.json();

    if (!result.success) {
      console.error('❌ Firecrawl failed:', result);
      process.exit(1);
    }

    console.log('✅ Firecrawl succeeded!');
    console.log();
    console.log('📊 Response structure:');
    console.log('  - success:', result.success);
    console.log('  - has html:', !!result.data?.html);
    console.log('  - has markdown:', !!result.data?.markdown);
    console.log('  - html length:', result.data?.html?.length || 0);
    console.log('  - markdown length:', result.data?.markdown?.length || 0);
    console.log();

    // Check if we got the schedule table
    const html = result.data?.html || '';
    const markdown = result.data?.markdown || '';
    const hasTable = html.includes('<table') || html.includes('schedule');
    const hasGames = html.includes('vs') || html.includes('at ') || markdown.includes('vs') || markdown.includes('at ');
    const has403 = html.includes('403') || html.includes('Forbidden');

    console.log('🔍 Content analysis:');
    console.log('  - Contains table:', hasTable);
    console.log('  - Contains game data:', hasGames);
    console.log('  - Contains 403 error:', has403);
    console.log();

    // Save the HTML for inspection
    fs.writeFileSync('firecrawl-result.html', html);
    console.log('💾 Full HTML saved to: firecrawl-result.html');

    if (result.data?.markdown) {
      fs.writeFileSync('firecrawl-result.md', markdown);
      console.log('💾 Markdown saved to: firecrawl-result.md');

      // Show first 1000 chars of markdown
      console.log();
      console.log('📝 Markdown preview (first 1000 chars):');
      console.log('─'.repeat(80));
      console.log(markdown.slice(0, 1000));
      console.log('─'.repeat(80));
    }

    if (hasGames && !has403) {
      console.log();
      console.log('🎉 SUCCESS! Firecrawl can bypass the 403 and get the schedule!');
    } else if (has403) {
      console.log();
      console.log('❌ Firecrawl also got 403 - the API blocking is very aggressive');
    } else {
      console.log();
      console.log('⚠️  Firecrawl succeeded but no game data found - may need longer wait time');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

testFirecrawl();
