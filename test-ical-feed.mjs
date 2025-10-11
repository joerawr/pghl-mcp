#!/usr/bin/env node
/**
 * Test if PGHL has a publicly accessible iCal/calendar feed
 * Calendar feeds are often meant for public consumption
 */

// Try various iCal endpoint patterns
// FOUND THE ACTUAL URL FROM THE PAGE!
const ICAL_URLS = [
  // The actual public iCal feed with client_service_id (found in page footer)
  'https://web.api.digitalshift.ca/partials/stats/schedule/ical?season_id=9486&league_id=1447&client_service_id=05e3fa78-061c-4607-a558-a54649c5044f',
  // Try without client_service_id
  'https://web.api.digitalshift.ca/partials/stats/schedule/ical?league_id=1447&season_id=9486',
  // Try with division filter
  'https://web.api.digitalshift.ca/partials/stats/schedule/ical?season_id=9486&league_id=1447&division_id=42897&client_service_id=05e3fa78-061c-4607-a558-a54649c5044f',
  // Try team-specific feed (Las Vegas Storm 12u AA)
  'https://web.api.digitalshift.ca/partials/stats/schedule/ical?league_id=1447&team_id=586889&client_service_id=05e3fa78-061c-4607-a558-a54649c5044f',
];

async function testIcalFeed(url) {
  console.log(`\n🔍 Testing: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      console.log(`   Content-Type: ${contentType}`);

      const text = await response.text();
      console.log(`   Length: ${text.length} bytes`);

      // Check if it's valid iCal format
      if (text.includes('BEGIN:VCALENDAR') || text.includes('BEGIN:VEVENT')) {
        console.log('   ✅ Valid iCal format detected!');
        console.log(`\n   Preview (first 500 chars):`);
        console.log('   ' + '─'.repeat(60));
        console.log('   ' + text.slice(0, 500).split('\n').join('\n   '));
        console.log('   ' + '─'.repeat(60));
        return { url, success: true, data: text };
      } else {
        console.log(`   ❌ Not iCal format. First 200 chars:`);
        console.log('   ' + text.slice(0, 200));
      }
    } else {
      const errorText = await response.text();
      if (errorText.length < 200) {
        console.log(`   Error: ${errorText}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  return { url, success: false };
}

async function main() {
  console.log('🔥 Testing for publicly accessible iCal/calendar feeds\n');
  console.log('═'.repeat(70));

  const results = [];
  for (const url of ICAL_URLS) {
    const result = await testIcalFeed(url);
    results.push(result);
  }

  console.log('\n\n📊 Summary');
  console.log('═'.repeat(70));

  const successful = results.filter(r => r.success);
  if (successful.length > 0) {
    console.log(`\n✅ Found ${successful.length} working iCal feed(s):\n`);
    successful.forEach(r => console.log(`   - ${r.url}`));
    console.log('\n🎉 SUCCESS! We can use iCal feeds to get schedule data!');
    console.log('   This bypasses all the Angular/XHR/403 issues completely.');
  } else {
    console.log('\n❌ No publicly accessible iCal feeds found.');
    console.log('   Next steps: Contact HockeyShift or use local Puppeteer only.');
  }
}

main();
