# HGT Integration Guide: iCal-Based PGHL Schedule Tools

## Overview

The PGHL MCP Server has been completely rewritten to use public iCal calendar feeds instead of Puppeteer scraping. This eliminates all 403 Forbidden errors on Vercel and provides fast, reliable access to PGHL schedule data.

**Key Improvements:**
- ✅ No more 403 errors - uses public calendar subscription endpoints
- ✅ **Returns structured JSON** instead of formatted text - easier for LLMs to parse
- ✅ **Machine-readable dates** (`YYYY-MM-DD` format) - fixes travel calculator date parsing
- ✅ 14x faster for team-specific queries (16 games vs 216 games)
- ✅ Works on Vercel without residential IP requirements
- ✅ Simpler architecture - no browser automation overhead

---

## Why JSON Format?

The previous version returned human-readable text like:
```
Sat Oct 4 at 8:00 AM LA Lions 12u AA @ Vegas Jr. Golden Knights 12u A
```

This caused **date parsing issues** in the travel calculator because:
- Missing year (`Sat Oct 4` vs `2025-10-04`)
- Ambiguous format (month name vs numeric)
- Required LLM to extract structured data from unstructured text

**New JSON format solves this:**
```json
{
  "date": "2025-09-13",    // ✅ ISO 8601 format with year
  "time": "10:00 AM",      // ✅ Clear time field
  "home": "...",           // ✅ Explicit home/away distinction
  "venue": "...",          // ✅ Separate venue field
  ...
}
```

This matches SCAHA's structured format and enables reliable date parsing for travel calculations.

---

## New Tool Architecture

### 1. `get_team_schedule` - Primary Tool

**Use Case:** Most common queries about a specific team's schedule

**Input:**
```json
{
  "team_id": "586889",           // Required: Use list_schedule_options to discover
  "season_id": "9486"             // Optional: Defaults to current season
}
```

**Output (JSON):**
```json
{
  "games": [
    {
      "date": "2025-09-13",
      "time": "10:00 AM",
      "home": "Las Vegas Storm 12u AA",
      "away": "Santa Clarita Lady Flyers 12u AA",
      "venue": "Lake Forest Ice Palace",
      "division": "12u AA",
      "rink": "Main",
      "gameType": "away"
    },
    ...
  ],
  "metadata": {
    "count": 16,
    "team_id": "586889",
    "season_id": "9486",
    "type": "team_schedule"
  }
}
```

**When to use:**
- "When is Las Vegas Storm's next game?"
- "Show me the team schedule for the rest of the month"
- "What games does my daughter's team have this weekend?"

**Performance:** ~16 games, fast response time

---

### 2. `get_division_schedule` - Full Season View

**Use Case:** Broader queries across multiple teams or the entire season

**Input:**
```json
{
  "season_id": "9486",            // Required: Season identifier
  "division_id": "12345"          // Optional: Filter to specific division
}
```

**Output (JSON):**
```json
{
  "games": [
    {
      "date": "2025-09-13",
      "time": "7:15 AM",
      "home": "San Jose Jr Sharks 14u AA",
      "away": "Vegas Jr Golden Knights 14u AA",
      "venue": "Sharks Ice San Jose",
      "division": "14u AA",
      "rink": "Grey Rink",
      "gameType": "away"
    },
    ...
  ],
  "metadata": {
    "count": 216,
    "season_id": "9486",
    "division_id": null,
    "type": "full_season_schedule"
  }
}
```

**Note:** Dates are in `YYYY-MM-DD` format (machine-readable), enabling proper date parsing and filtering in HGT.

**When to use:**
- "Show me all 12u AA games this weekend"
- "What's happening across the league next month?"
- "Give me the full season schedule"

**Performance:** ~216 games for full season, group by date for better readability

---

### 3. `list_schedule_options` - Discovery Tool

**Use Case:** Progressive discovery of available seasons, divisions, and teams

**Note:** This tool still uses Puppeteer scraping for discovery. It may encounter 403 errors on Vercel, but this is acceptable because:
- It's only used for initial discovery (not frequent queries)
- Team/season IDs can be cached or hardcoded in HGT
- The schedule tools (which are used frequently) work reliably

**Input:**
```json
{
  "season": "2025-26",           // Optional: Filter to season
  "division": "12u AA"           // Optional: Filter to division (requires season)
}
```

---

## HGT Implementation Strategy

### Recommended Approach

1. **Cache Known IDs**
   - Store commonly used team IDs, season IDs, and division IDs in HGT
   - Example: Las Vegas Storm 12u AA = `586889`, Season 2025-26 = `9486`
   - Avoids need for frequent `list_schedule_options` calls

2. **Default to `get_team_schedule`**
   - Use this for 90% of user queries
   - It's 14x faster (16 games vs 216 games)
   - Aligns with your user model (parents tracking one team)

3. **Use `get_division_schedule` for Broad Queries**
   - Only when user explicitly asks for "all games" or "league-wide"
   - Always use `group_by_date: true` for readability
   - Consider date filtering in HGT to reduce response size

4. **Fallback Strategy**
   - If `list_schedule_options` fails (403 error), prompt user to provide team/season IDs
   - Or hardcode common teams for your user base

---

## MCP Server Deployment

### Production URL
```
https://pghl-ho0y620uy-joe-rogers-projects.vercel.app/api/mcp
```

### Health Check
The server is live and should respond to MCP protocol requests. Test with:

```bash
curl -X POST https://pghl-ho0y620uy-joe-rogers-projects.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

Expected response:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "get_team_schedule",
        "description": "Get the schedule for a specific PGHL team...",
        ...
      },
      {
        "name": "get_division_schedule",
        "description": "Get the full season schedule...",
        ...
      },
      {
        "name": "list_schedule_options",
        "description": "Progressive discovery...",
        ...
      }
    ]
  }
}
```

---

## Migration from Old Tools

### Old → New Mapping

| Old Tool | New Tool | Notes |
|----------|----------|-------|
| `get_schedule` | `get_team_schedule` | Now requires `team_id` instead of team name |
| `get_schedule` (division-wide) | `get_division_schedule` | Split into separate tool for clarity |
| `list_schedule_options` | `list_schedule_options` | Same, but may have 403 issues on Vercel |

### Breaking Changes

1. **Team Identification**
   - Old: `team: "Las Vegas Storm 12u AA"` (name string)
   - New: `team_id: "586889"` (numeric ID)
   - **Action Required:** Use `list_schedule_options` to discover team IDs, then cache them in HGT

2. **Season Format**
   - Old: `season: "2025-26"` (readable format)
   - New: `season_id: "9486"` (numeric ID)
   - **Action Required:** Cache season ID mappings

3. **Tool Selection**
   - Old: Single `get_schedule` tool with `team` parameter
   - New: Separate tools for team vs division queries
   - **Action Required:** Update HGT logic to choose the right tool

---

## Example HGT Conversation Flow

### Scenario 1: Team-Specific Query

**User:** "When does Las Vegas Storm play next?"

**HGT Logic:**
1. Recognize team name → map to `team_id: "586889"`
2. Call `get_team_schedule` with `team_id: "586889"`
3. Parse JSON response: `const data = JSON.parse(result.content[0].text)`
4. Filter to upcoming games: `const upcoming = data.games.filter(g => new Date(g.date) >= new Date())`
5. Present conversationally: "Las Vegas Storm's next game is Saturday, September 13th at 10:00 AM against Santa Clarita Lady Flyers at Lake Forest Ice Palace (Main rink)."

### Scenario 2: Division-Wide Query

**User:** "Show me all 12u AA games this weekend"

**HGT Logic:**
1. Recognize division → map to `division_id: "12345"`
2. Call `get_division_schedule` with `season_id: "9486"`, `division_id: "12345"`
3. Parse JSON response: `const data = JSON.parse(result.content[0].text)`
4. Filter to this weekend:
   ```javascript
   const weekend = data.games.filter(g => {
     const date = new Date(g.date);
     return date >= saturday && date <= sunday;
   });
   ```
5. Group by date and present: "This weekend's 12u AA games:\n\n**Saturday:**\n- 9:00 AM: Bay Area Sharks @ Sacramento Delta at Oakland Ice Center\n- 2:30 PM: Las Vegas Storm @ California Heat at Great Park Ice\n\n**Sunday:**\n..."

### Scenario 3: First-Time User (No Cached IDs)

**User:** "What's my team's schedule?"

**HGT Logic:**
1. No team context → prompt: "Which team would you like to track? (e.g., Las Vegas Storm 12u AA)"
2. User provides team name
3. Call `list_schedule_options` to discover team ID (or use cached mapping)
4. Save team ID to user profile
5. Call `get_team_schedule` with discovered team ID
6. Present schedule

---

## Testing the New Tools

### Local Testing (STDIO)

```bash
cd /path/to/pghl-mcp
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"get_team_schedule","arguments":{"team_id":"586889","season_id":"9486"}},"id":1}' | npm run dev
```

### HTTP Testing (Vercel)

```bash
curl -X POST https://pghl-ho0y620uy-joe-rogers-projects.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_team_schedule",
      "arguments": {
        "team_id": "586889",
        "season_id": "9486"
      }
    },
    "id": 1
  }'
```

---

## Technical Details

### iCal Feed Discovery

The client service ID was extracted from the "Subscribe to Schedule" button on pacificgirlshockey.com:

```javascript
const CLIENT_SERVICE_ID = '05e3fa78-061c-4607-a558-a54649c5044f';
const LEAGUE_ID = '1447'; // PGHL league ID
const BASE_ICAL_URL = 'https://web.api.digitalshift.ca/partials/stats/schedule/ical';
```

### URL Structure

**Team Schedule:**
```
https://web.api.digitalshift.ca/partials/stats/schedule/ical?
  league_id=1447&
  client_service_id=05e3fa78-061c-4607-a558-a54649c5044f&
  team_id=586889&
  season_id=9486
```

**Division Schedule:**
```
https://web.api.digitalshift.ca/partials/stats/schedule/ical?
  league_id=1447&
  client_service_id=05e3fa78-061c-4607-a558-a54649c5044f&
  season_id=9486&
  division_id=12345
```

**Full Season Schedule:**
```
https://web.api.digitalshift.ca/partials/stats/schedule/ical?
  league_id=1447&
  client_service_id=05e3fa78-061c-4607-a558-a54649c5044f&
  season_id=9486
```

### Game Object Structure

```typescript
interface Game {
  date: string;        // "2025-09-12" (YYYY-MM-DD)
  time: string;        // "10:00 AM" (12-hour format)
  home: string;        // "Las Vegas Storm 12u AA"
  away: string;        // "Santa Clarita Lady Flyers 12u AA"
  venue: string;       // "Simi Valley IcePlex"
  division: string;    // "12u AA"
  rink?: string;       // "Rink 2" (optional)
  gameType?: string;   // "home" | "away" | "neutral" (optional)
  status?: string;     // Future use (optional)
}
```

---

## Known Limitations

1. **Discovery Tool Issues**
   - `list_schedule_options` may still encounter 403 errors on Vercel
   - **Mitigation:** Cache team/season IDs in HGT, or prompt user for IDs directly

2. **Season ID Mapping**
   - No public API to map season names to IDs
   - **Mitigation:** Hardcode common seasons or extract from initial discovery

3. **Real-Time Updates**
   - iCal feeds may have slight delays (usually < 5 minutes)
   - **Mitigation:** Not a concern for typical use cases

---

## Monitoring & Debugging

### Vercel Deployment

Pushes to `main` branch auto-deploy to Vercel. Monitor at:
- https://vercel.com/joe-rogers-projects/pghl

### Logs

- **STDIO:** Logs go to stderr (stdout reserved for MCP protocol)
- **HTTP:** Vercel function logs available in dashboard

### Common Issues

**Issue:** 403 Forbidden on `list_schedule_options`
- **Cause:** Puppeteer scraping blocked by bot detection
- **Solution:** Use cached team IDs or prompt user directly

**Issue:** Empty schedule returned
- **Cause:** Invalid team_id or season_id
- **Solution:** Verify IDs with `list_schedule_options` or check PGHL website

---

## Next Steps for HGT

1. **Update MCP Server URL**
   - Point HGT to new Vercel deployment
   - Test with both tools

2. **Implement Team ID Caching**
   - Create mapping: `{"Las Vegas Storm 12u AA": "586889", ...}`
   - Store in HGT database or config file

3. **Update Query Logic**
   - Detect team-specific vs division-wide queries
   - Route to appropriate tool

4. **Test Edge Cases**
   - First-time user with no cached IDs
   - Division-wide queries with date filtering
   - Handling of empty results

5. **Monitor Performance**
   - Compare response times: team (fast) vs division (slower)
   - Track success rate of schedule fetches

---

## Support

For issues or questions:
- **GitHub:** https://github.com/joerawr/pghl-mcp/issues
- **MCP Docs:** https://modelcontextprotocol.io/
- **PGHL Website:** https://www.pacificgirlshockey.com/

---

## Summary

**Key Takeaways:**
- ✅ **Returns JSON** - structured data matching SCAHA format
- ✅ **Machine-readable dates** - fixes travel calculator parsing (`YYYY-MM-DD` format)
- ✅ iCal feeds solve all 403 errors
- ✅ Use `get_team_schedule` for 90% of queries (14x faster)
- ✅ Cache team/season IDs to avoid discovery tool
- ✅ Production URL: https://pghl-ho0y620uy-joe-rogers-projects.vercel.app/api/mcp
- ✅ Breaking change: Team names → team IDs (requires migration)

**Recommended First Step:**
Run `list_schedule_options` locally (STDIO) to build your team ID mapping, then integrate into HGT with `get_team_schedule` as the primary tool. Parse the JSON response with `JSON.parse(result.content[0].text)` to access game data.
