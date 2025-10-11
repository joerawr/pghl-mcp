#!/usr/bin/env node
/**
 * Capture the actual API request that Angular makes
 * This will show us the headers, params, and response format
 */

import puppeteer from 'puppeteer-core';

async function captureAPIRequest() {
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Track all requests to the schedule API
  const apiCalls = [];

  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('web.api.digitalshift.ca/partials/stats/schedule')) {
      console.log('\n📤 OUTGOING REQUEST:');
      console.log('URL:', url);
      console.log('Method:', request.method());
      console.log('Headers:', JSON.stringify(request.headers(), null, 2));
      console.log('Post Data:', request.postData());

      apiCalls.push({
        url,
        method: request.method(),
        headers: request.headers(),
        postData: request.postData(),
      });
    }
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('web.api.digitalshift.ca/partials/stats/schedule')) {
      console.log('\n📥 INCOMING RESPONSE:');
      console.log('URL:', url);
      console.log('Status:', response.status());
      console.log('Headers:', JSON.stringify(response.headers(), null, 2));

      try {
        const text = await response.text();
        console.log('Body length:', text.length);
        console.log('Body preview (first 2000 chars):');
        console.log(text.substring(0, 2000));

        // Try to parse as JSON
        try {
          const json = JSON.parse(text);
          console.log('\n✅ Parsed JSON structure:');
          console.log(JSON.stringify(json, null, 2).substring(0, 2000));
        } catch {
          console.log('\n📝 HTML/Text response (not JSON)');
        }
      } catch (err) {
        console.log('Could not read body:', err.message);
      }
    }
  });

  console.log('\n🌐 Navigating to PGHL schedule page...');
  await page.goto(
    'https://www.pacificgirlshockey.com/stats#/1447/schedule?season_id=9486&division_id=42897',
    { waitUntil: 'networkidle2', timeout: 30000 }
  );

  console.log('\n⏳ Waiting 10 seconds for all requests to complete...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log('\n' + '='.repeat(80));
  console.log(`📊 Captured ${apiCalls.length} API calls`);
  console.log('='.repeat(80));

  if (apiCalls.length > 0) {
    console.log('\n🎯 Example request to replicate:');
    const example = apiCalls[0];
    console.log(`\ncurl '${example.url}' \\`);
    for (const [key, value] of Object.entries(example.headers)) {
      console.log(`  -H '${key}: ${value}' \\`);
    }
    console.log('');
  }

  await browser.close();
}

captureAPIRequest().catch(console.error);
