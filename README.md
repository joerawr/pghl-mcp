# @joerawr/pghl-mcp

[![npm version](https://badge.fury.io/js/@joerawr%2Fpghl-mcp.svg)](https://www.npmjs.com/package/@joerawr/pghl-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Model Context Protocol (MCP) server for PGHL (Pacific Girls Hockey League) schedule data. Provides team schedules and discovery via web scraping from pacificgirlshockey.com.

## Installation

### Claude Desktop

Add to your Claude Desktop config:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "pghl": {
      "command": "npx",
      "args": ["-y", "@joerawr/pghl-mcp"]
    }
  }
}
```

Restart Claude Desktop after adding.

### Chrome/Chromium Required

This server uses Puppeteer for web scraping. Chrome or Chromium must be installed.

**Custom Chrome path** (optional):
```json
{
  "mcpServers": {
    "pghl": {
      "command": "npx",
      "args": ["-y", "@joerawr/pghl-mcp"],
      "env": {
        "CHROME_EXECUTABLE_PATH": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      }
    }
  }
}
```

## Available Tools

### get_schedule
Get team schedule with optional date filtering.

**Parameters:**
- `season` (required): Season identifier (e.g., "2025-26")
- `division` (required): Division name (e.g., "12u AA", "14u AAA")
- `team` (required): Team name (e.g., "Las Vegas Storm 12u AA")
- `date` (optional): Filter to specific date (YYYY-MM-DD)

**Example queries:**
- "Get the schedule for Las Vegas Storm 12u AA in 2025-26"
- "Does Las Vegas Storm 12u AA play on October 15, 2025?"

### get_next_game
Find the next upcoming game for a team.

**Parameters:**
- `season` (required): Season identifier
- `division` (required): Division name
- `team` (required): Team name

**Example query:** "When does Las Vegas Storm 12u AA play next?"

### list_schedule_options
List available seasons, divisions, and teams.

**Parameters:**
- `season` (optional): Filter by season to get divisions
- `division` (optional): Filter by division to get teams (requires season)

**Example queries:**
- "What seasons are available in PGHL?"
- "What divisions are in the 2025-26 PGHL season?"
- "What teams are in 12u AA for 2025-26?"

## HTTP Deployment (Optional)

For remote deployment, this server also supports HTTP transport via StreamableHTTP.

**Deploy to Vercel:**
1. Clone repository: `git clone https://github.com/joerawr/pghl-mcp.git`
2. Install: `npm install`
3. Build: `npm run build:http`
4. Deploy the `http/` directory to Vercel
5. Endpoint available at: `https://your-domain.com/api/mcp`

**Note**: HTTP transport is for self-hosted deployments. Claude Desktop uses STDIO (above).

## Development

```bash
git clone https://github.com/joerawr/pghl-mcp.git
cd pghl-mcp
npm install
npm run build        # Build STDIO server
npm run dev          # Run in dev mode
npm test             # Test STDIO server
```

## Environment Variables

Create a `.env` file (see `.env.example`):

```bash
# Chrome executable path (required for Puppeteer)
CHROME_EXECUTABLE_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome

# PGHL website URL (default: https://www.pacificgirlshockey.com)
PGHL_WEBSITE_URL=https://www.pacificgirlshockey.com

# Node environment
NODE_ENV=development
```

## Data Source

**pacificgirlshockey.com** - Pacific Girls Hockey League
- Schedule URL: https://www.pacificgirlshockey.com/schedule

Data is scraped using Puppeteer from the HockeyShift platform.

## Features

- ✅ Team schedule retrieval with date, time, opponent, venue
- ✅ Next game queries ("when do we play next?")
- ✅ Weekend game queries ("who do we play this weekend?")
- ✅ Progressive team discovery (season → division → team)
- ✅ Dual transport support (STDIO + StreamableHTTP)
- ✅ Vercel deployment ready

## License

MIT - See LICENSE file

## Contributing

Issues and PRs welcome: https://github.com/joerawr/pghl-mcp/issues

## Related Projects

- [scaha-mcp](https://github.com/joerawr/scaha.net-mcp) - SCAHA hockey league MCP server
- [Hockey Go Time](https://github.com/joerawr/HockeyGoTime) - Conversational AI for hockey schedules
