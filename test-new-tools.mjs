#!/usr/bin/env node
/**
 * Quick test of the new iCal-based tools
 */

import { getTeamScheduleTool } from './dist/tools/get_team_schedule.js';
import { getDivisionScheduleTool } from './dist/tools/get_division_schedule.js';

console.log('🧪 Testing new iCal-based MCP tools\n');
console.log('='.repeat(70));

// Test 1: Team schedule
console.log('\n📅 Test 1: get_team_schedule');
console.log('   Team: Las Vegas Storm 12u AA (team_id=586889)');
console.log('   Season: 9486 (2025-26)\n');

try {
  const result = await getTeamScheduleTool.handler({
    team_id: '586889',
    season_id: '9486',
  });

  console.log('✅ Success!');
  const jsonResponse = JSON.parse(result.content[0].text);
  console.log(`   Games returned: ${jsonResponse.games.length}`);
  console.log(`   Metadata: ${JSON.stringify(jsonResponse.metadata)}`);
  console.log('\n   First game (JSON):');
  console.log('   ' + JSON.stringify(jsonResponse.games[0], null, 2).split('\n').join('\n   '));
} catch (error) {
  console.error('❌ Failed:', error.message);
}

// Test 2: Division schedule
console.log('\n\n📅 Test 2: get_division_schedule');
console.log('   Season: 9486 (2025-26 full season)');
console.log('   No division filter (all games)\n');

try {
  const result = await getDivisionScheduleTool.handler({
    season_id: '9486',
  });

  console.log('✅ Success!');
  const jsonResponse = JSON.parse(result.content[0].text);
  console.log(`   Games returned: ${jsonResponse.games.length}`);
  console.log(`   Metadata: ${JSON.stringify(jsonResponse.metadata)}`);
  console.log('\n   First game (JSON):');
  console.log('   ' + JSON.stringify(jsonResponse.games[0], null, 2).split('\n').join('\n   '));
} catch (error) {
  console.error('❌ Failed:', error.message);
}

console.log('\n' + '='.repeat(70));
console.log('✅ All tests complete!\n');
