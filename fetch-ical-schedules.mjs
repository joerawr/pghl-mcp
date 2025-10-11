#!/usr/bin/env node
/**
 * Fetch and parse PGHL iCal schedules
 * Saves both full season and team-specific schedules for comparison
 */

import ical from 'node-ical';
import fs from 'fs';

const CLIENT_SERVICE_ID = '05e3fa78-061c-4607-a558-a54649c5044f';
const LEAGUE_ID = '1447';
const SEASON_ID = '9486'; // 2025-26 season
const TEAM_ID = '586889'; // Las Vegas Storm 12u AA

// iCal feed URLs
const FULL_SEASON_URL = `https://web.api.digitalshift.ca/partials/stats/schedule/ical?season_id=${SEASON_ID}&league_id=${LEAGUE_ID}&client_service_id=${CLIENT_SERVICE_ID}`;
const TEAM_URL = `https://web.api.digitalshift.ca/partials/stats/schedule/ical?league_id=${LEAGUE_ID}&team_id=${TEAM_ID}&client_service_id=${CLIENT_SERVICE_ID}`;

async function fetchAndParseIcal(url, name) {
  console.log(`\n📅 Fetching ${name}...`);
  console.log(`   URL: ${url}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const icalData = await response.text();
    console.log(`   ✅ Downloaded ${icalData.length} bytes`);

    // Parse iCal data
    const events = await ical.async.parseICS(icalData);

    // Extract game events
    const games = [];
    for (const [uid, event] of Object.entries(events)) {
      if (event.type === 'VEVENT') {
        // Parse the SUMMARY field which contains team names
        // Format: "Away Team @ Home Team" or "Away Team vs Home Team"
        const summary = event.summary || '';
        const location = event.location || '';

        let awayTeam = '';
        let homeTeam = '';

        if (summary.includes(' @ ')) {
          [awayTeam, homeTeam] = summary.split(' @ ');
        } else if (summary.includes(' vs ')) {
          [awayTeam, homeTeam] = summary.split(' vs ');
        }

        const game = {
          uid: event.uid,
          summary: summary,
          away_team: awayTeam.trim(),
          home_team: homeTeam.trim(),
          start: event.start,
          end: event.end,
          location: location,
          description: event.description || '',
        };

        games.push(game);
      }
    }

    console.log(`   ✅ Parsed ${games.length} games`);

    // Sort by start time
    games.sort((a, b) => new Date(a.start) - new Date(b.start));

    return {
      name,
      url,
      total_games: games.length,
      games,
    };

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return {
      name,
      url,
      error: error.message,
      games: [],
    };
  }
}

async function main() {
  console.log('🔥 PGHL iCal Schedule Fetcher');
  console.log('═'.repeat(70));

  // Fetch both formats
  const fullSchedule = await fetchAndParseIcal(FULL_SEASON_URL, 'Full Season Schedule (All Teams)');
  const teamSchedule = await fetchAndParseIcal(TEAM_URL, 'Team Schedule (Las Vegas Storm 12u AA)');

  console.log('\n\n📊 Results Summary');
  console.log('═'.repeat(70));
  console.log(`Full Season: ${fullSchedule.total_games} games`);
  console.log(`Team Only:   ${teamSchedule.total_games} games`);

  // Save to JSON files
  console.log('\n💾 Saving to files...');

  fs.writeFileSync(
    'pghl-full-schedule.json',
    JSON.stringify(fullSchedule, null, 2)
  );
  console.log('   ✅ Saved: pghl-full-schedule.json');

  fs.writeFileSync(
    'pghl-team-schedule.json',
    JSON.stringify(teamSchedule, null, 2)
  );
  console.log('   ✅ Saved: pghl-team-schedule.json');

  // Show sample data
  console.log('\n\n📝 Sample Game Data (Full Schedule)');
  console.log('═'.repeat(70));
  if (fullSchedule.games.length > 0) {
    const sample = fullSchedule.games[0];
    console.log(JSON.stringify(sample, null, 2));
  }

  console.log('\n\n📝 Sample Game Data (Team Schedule)');
  console.log('═'.repeat(70));
  if (teamSchedule.games.length > 0) {
    const sample = teamSchedule.games[0];
    console.log(JSON.stringify(sample, null, 2));
  }

  console.log('\n\n✅ Done! Files ready for HGT review:');
  console.log('   - pghl-full-schedule.json (all games)');
  console.log('   - pghl-team-schedule.json (single team)');
}

main();
