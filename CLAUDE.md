# CLAUDE.md - PGHL MCP Server

This file provides guidance when working with code in this repository.

## Project Overview

**PGHL MCP Server** is a Model Context Protocol (MCP) server that provides access to youth hockey data from pacificgirlshockey.com (Pacific Girls Hockey League). It's designed to be used as both a local tool (via STDIO) and a remotely deployed service (via HTTP).

## Package Information

- **npm package**: `@joerawr/pghl-mcp`
- **Type**: Dual-transport MCP server
- **Package manager**: npm (not pnpm or yarn)
- **Entry points**:
  - STDIO: `dist/index.js` (CLI executable)
  - HTTP: `http/app/api/mcp/route.ts` (Next.js API route)

## Development Commands

```bash
npm install              # Install dependencies
npm run build            # Build STDIO transport (default)
npm run build:stdio      # Build STDIO transport (TypeScript → dist/)
npm run build:http       # Build HTTP transport (Next.js → http/.next/)
npm run build:all        # Build both transports
npm run dev              # Run STDIO server in dev mode (tsx)
npm run dev:http         # Run HTTP server in dev mode (Next.js)
npm run typecheck        # Type-check without emitting files
npm test                 # Test STDIO server
```

## Invocation Methods

### STDIO Transport (Local)

Invocation: `npx @joerawr/pghl-mcp`

Used by:
- Claude Desktop
- Cursor IDE
- Other MCP clients that spawn local processes

### HTTP Transport (Remote)

- URL: `https://pghl-ho0y620uy-joe-rogers-projects.vercel.app/api/mcp`
- Deployed to Vercel
- Enables remote access to PGHL data

## Architecture

### Dual Transport Pattern

```
                    ┌─────────────────┐
                    │   MCP Tools     │
                    │   (src/tools/)  │
                    └────────┬────────┘
                             │
            ┌────────────────┴────────────────┐
            │                                 │
    ┌───────▼────────┐              ┌────────▼─────────┐
    │ STDIO Server   │              │  HTTP Server     │
    │ (src/index.ts) │              │ (http/app/api/)  │
    └───────┬────────┘              └────────┬─────────┘
            │                                 │
    ┌───────▼────────┐              ┌────────▼─────────┐
    │  Local Client  │              │  Remote Client   │
    │ (Claude Desktop│              │   (Vercel)       │
    └────────────────┘              └──────────────────┘
```

### Technology Stack

- **Web Scraping**: Puppeteer (browser automation)
- **Platform**: HockeyShift (AngularJS SPA)
- **MCP SDK**: @modelcontextprotocol/sdk
- **HTTP Handler**: mcp-handler (StreamableHTTP)
- **Date/Time**: date-fns with Pacific timezone support
- **Validation**: Zod schemas

### Key Components

1. **Scrapers** (`src/scraper/`)
   - `browser.ts` - Puppeteer configuration (local + Vercel)
   - `navigation.ts` - HockeyShift dropdown navigation
   - `discovery.ts` - Progressive discovery orchestration
   - `schedule.ts` - Schedule table extraction

2. **Tools** (`src/tools/`)
   - `list_schedule_options.ts` - Progressive discovery (seasons → divisions → teams)
   - `get_schedule.ts` - Full team schedule retrieval
   - Future: `get_team_stats.ts`, `get_player_stats.ts`

3. **Models** (`src/models/`)
   - `game.ts` - Game data structure
   - `select-option.ts` - Dropdown options
   - `schedule-options.ts` - Discovery response

4. **Utils** (`src/utils/`)
   - `date-parser.ts` - PGHL date/time parsing (Pacific timezone)
   - `errors.ts` - Custom error types
   - `logger.ts` - Logging to stderr (stdout reserved for MCP)

## Data Source

**pacificgirlshockey.com** - Pacific Girls Hockey League
- Schedule URL: https://www.pacificgirlshockey.com/stats#/1447/schedule
- League ID: 1447 (constant)
- Platform: HockeyShift (AngularJS)

Data is scraped using Puppeteer from the HockeyShift platform.

## Code Reuse from SCAHA-MCP

This project reuses 87% of SCAHA-MCP's architecture:
- ✅ Dual transport pattern (STDIO + HTTP)
- ✅ MCP protocol handling
- ✅ Puppeteer scraping infrastructure
- ✅ Error handling patterns
- ✅ Date/time parsing utilities
- ✅ Tool structure and validation

**Differences:**
- Website: pacificgirlshockey.com vs scaha.net
- Platform: HockeyShift (Angular) vs JavaServer Faces (JSF)
- Navigation: Dropdown selectors vs JSF form submission
- Date format: "Sat Sep 13" vs "MM/DD/YYYY"

## Publishing to npm

```bash
npm run build:stdio      # Build the package
npm publish --access public
```

Package contents (defined in package.json `files`):
- `dist/` - Compiled TypeScript
- `README.md`
- `LICENSE`

## Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

## Vercel Deployment

```bash
vercel --prod     # Deploy to production
```

Configuration in `vercel.json`:
- Build command: `npm run build:http`
- Output directory: `http/.next`
- Framework: Next.js

## Environment Variables

Required for local development (create `.env`):

```bash
# Chrome executable path (required for Puppeteer)
CHROME_EXECUTABLE_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome

# PGHL website URL (default: https://www.pacificgirlshockey.com)
PGHL_WEBSITE_URL=https://www.pacificgirlshockey.com

# Node environment
NODE_ENV=development
```

## Testing

Manual testing workflow (no automated tests per constitution):

1. Test STDIO server:
```bash
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | npm run dev
```

2. Test discovery:
```bash
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"list_schedule_options","arguments":{}},"id":2}' | npm run dev
```

3. Test schedule retrieval:
```bash
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"get_schedule","arguments":{"season":"2025-26","division":"12u AA","team":"Las Vegas Storm"}},"id":3}' | npm run dev
```

## Related Projects

- [scaha-mcp](https://github.com/joerawr/scaha-mcp) - SCAHA hockey league MCP server (source of 87% code reuse)
- [Hockey Go Time](https://github.com/joerawr/HockeyGoTime) - Conversational AI for hockey schedules

## License

MIT - See LICENSE file
