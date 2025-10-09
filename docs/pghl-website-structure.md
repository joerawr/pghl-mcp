# PGHL Website Structure Investigation (T015)

**Date**: 2025-10-09
**URL**: https://www.pacificgirlshockey.com
**Platform**: HockeyShift (AngularJS SPA)

## Key Findings

### 1. Platform Technology
- **Framework**: AngularJS (ng-app="app")
- **Type**: Single Page Application (SPA)
- **Dynamic Rendering**: Content loaded via JavaScript/AJAX
- **Requires Puppeteer**: Cannot use simple HTTP scraping

### 2. URLs and Parameters
- **Schedule Base**: `/stats#/1447/schedule`
- **League ID**: `1447` (constant for PGHL)
- **Season ID**: `9486` (current season: 2025-26)
- **Tournament ID**: `2683` (alternative view)

**Example URLs**:
- Schedule: `https://www.pacificgirlshockey.com/stats#/1447/schedule?season_id=9486`
- Scores: `https://www.pacificgirlshockey.com/stats#/1447/scores?season_id=9486`
- Standings: `https://www.pacificgirlshockey.com/stats#/1447/standings?season_id=9486`

### 3. API Endpoints (Backend)
- **Web API**: `https://web.api.digitalshift.ca`
- **Stats API**: `https://stats.api.digitalshift.ca`
- **Live API**: `wss://live.digitalshift.ca` (WebSocket)

### 4. Teams Visible in HTML
The site network sidebar shows all 27 teams for current season:
- Anaheim Lady Ducks (12u AA, 12u AAA, 14u AA, 16u AA, 19u AA)
- CA Goldrush (12u A, 16u AA x2)
- Delta Knights (12u AA)
- LA Lions (12u AA, 12u AAA)
- Las Vegas Storm (12u AA, 14u AA)
- Portland Jr Winterhawks (19u AA)
- San Diego Angels (12u A, 14u AA, 19u AA)
- San Jose Jr Sharks (12u AAA, 14u AA, 19u AA)
- Santa Clarita Lady Flyers (12u AA, 14u AA)
- Tri Valley Lady Blue Devils (12u AAA)
- Vacaville Jets (16u AA)
- Vegas Jr. Golden Knights (12u A, 14u AA, 16u AA)

### 5. Scraping Strategy

**Approach**: Use Puppeteer to navigate to the schedule page and wait for Angular to render dropdowns/filters.

**Expected Selectors** (to be confirmed with Puppeteer):
- Season dropdown: Look for `<select>` or custom dropdown with season options
- Division dropdown: Similar pattern, activated after season selection
- Team dropdown: Similar pattern, activated after division selection
- Schedule table: Look for `<table>` or `<div>` containing game data

**Navigation Pattern** (Based on HockeyShift similarity to SCAHA):
1. Navigate to schedule URL
2. Wait for page load and Angular rendering
3. Extract season options from dropdown
4. Select season → wait for divisions to populate
5. Select division → wait for teams to populate
6. Select team → wait for schedule table to render
7. Extract game data from table

### 6. Data Available
From the team links, we can see:
- Team IDs (e.g., `586893` for Anaheim Lady Ducks 12u AA)
- Team stats URLs: `/stats#/1447/team/{team_id}`
- Team logos available via CDN

### 7. Challenges
- **Dynamic Content**: Must wait for Angular to render
- **AJAX Loading**: Dropdowns populate via API calls
- **Timing**: Need appropriate waits between selections
- **Selectors**: May need to inspect actual page to get exact selectors

## Next Steps (T016)
1. Use Puppeteer to navigate to schedule page
2. Use DevTools to inspect dropdown selectors
3. Test dropdown interaction sequence
4. Extract options and build SelectOption arrays
5. Implement navigation.ts with confirmed selectors
