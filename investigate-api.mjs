#!/usr/bin/env node
/**
 * Investigation script: DigitalShift API endpoints
 * Run with: node investigate-api.mjs
 */

const baseURL = 'https://web.api.digitalshift.ca/partials/stats/schedule';

// Parameters we know from PGHL:
// - League ID: 1447
// - Season ID: 9486 (2025-26 12u-19u AA)
// - Division ID: 42897 (12u AA)

async function fetchAPI(url, params) {
  const queryString = new URLSearchParams(params).toString();
  const fullURL = `${url}?${queryString}`;

  console.log(`\n🔍 Fetching: ${fullURL}`);

  try {
    const response = await fetch(fullURL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/json,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);

    const text = await response.text();
    console.log(`📏 Content Length: ${text.length} bytes`);
    console.log(`📄 Content Preview (first 1000 chars):\n`);
    console.log(text.substring(0, 1000));
    console.log(`\n...`);

    // Try to parse as JSON
    try {
      const json = JSON.parse(text);
      console.log(`\n✅ Valid JSON! Keys:`, Object.keys(json));
      if (Array.isArray(json)) {
        console.log(`   Array with ${json.length} items`);
      }
    } catch {
      console.log(`\n📝 Not JSON - likely HTML fragment`);
    }

    return text;
  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
}

// Try different parameter combinations
async function investigate() {
  console.log('='.repeat(80));
  console.log('🔬 DigitalShift API Investigation');
  console.log('='.repeat(80));

  // Test 1: League + Season + Division
  await fetchAPI(baseURL, {
    league_id: '1447',
    season_id: '9486',
    division_id: '42897',
  });

  // Test 2: Just league and season
  await fetchAPI(baseURL, {
    league_id: '1447',
    season_id: '9486',
  });

  // Test 3: Try without league_id (might be in path)
  await fetchAPI(baseURL, {
    season_id: '9486',
    division_id: '42897',
  });

  // Test 4: Check iCal endpoint mentioned in feedback
  console.log('\n' + '='.repeat(80));
  console.log('📅 Checking iCal endpoint');
  console.log('='.repeat(80));
  await fetchAPI(`${baseURL}/ical`, {
    league_id: '1447',
    season_id: '9486',
    division_id: '42897',
  });
}

investigate().catch(console.error);
