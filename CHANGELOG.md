# Changelog

All notable changes to the PGHL-MCP project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-10-09

### Fixed
- **Branding**: Replaced all SCAHA references with PGHL throughout codebase (#2)
  - Landing page now shows "PGHL MCP Server" instead of "SCAHA MCP Server"
  - Updated HTTP route comments to reference PGHL
  - Changed User-Agent from "SCAHA-MCP/1.0" to "PGHL-MCP/1.0"
  - Changed CSV filename prefix from "SCAHA_" to "PGHL_"

- **Tool List**: Corrected landing page to show only available tools (#2)
  - Listed 2 actual tools: `list_schedule_options`, `get_schedule`
  - Added "Future Tools" section for deferred tools: `get_team_stats`, `get_player_stats`
  - Removed misleading references to unimplemented tools

- **HTTP Route**: Fixed schema import warnings in `http/app/api/mcp/route.ts`
  - Imports now correctly reference schemas from `src/mcp/schemas.js`
  - Removed import errors that appeared during Vercel builds

### Documentation
- **CLAUDE.md**: Complete rewrite with PGHL-specific content
  - Added comprehensive architecture documentation
  - Documented dual transport pattern (STDIO + HTTP)
  - Added technology stack and component breakdown
  - Included testing examples and deployment instructions
  - Documented 87% code reuse from SCAHA-MCP

- **status.md**: Formatted constitution metadata

### Deployment
- Published to npm: https://www.npmjs.com/package/@joerawr/pghl-mcp
- Deployed to Vercel: https://pghl-8okosyss0-joe-rogers-projects.vercel.app

## [0.1.0] - 2025-10-09

### Added - Initial Release

**Phase 1-2: Project Setup & Infrastructure (T001-T014)**
- Created dual-transport MCP server (STDIO + HTTP)
- Established project structure based on SCAHA-MCP (87% code reuse)
- Implemented 6 data models: Game, Team, Division, Season, SelectOption, ScheduleOptions
- Created utility modules: date-parser, errors, logger
- Configured Puppeteer for browser automation (local + Vercel environments)
- Set up MCP server with Zod validation schemas

**Phase 3: User Story 2 - Team Discovery (T015-T020)**
- Documented PGHL website structure (HockeyShift platform analysis)
- Implemented progressive discovery workflow:
  - `src/scraper/navigation.ts` - HockeyShift dropdown navigation helpers
  - `src/scraper/discovery.ts` - Progressive discovery orchestration
  - `src/tools/list_schedule_options.ts` - MCP tool for team discovery
- Successfully tested 3-step discovery: seasons → divisions → teams
  - Retrieved 9 seasons from PGHL
  - Retrieved 4 divisions for 2025-26 season
  - Retrieved 8 teams in 12u AA division

**Phase 4: User Story 1 - Schedule Retrieval (T021-T026)**
- Implemented schedule scraping infrastructure:
  - `src/scraper/schedule.ts` - HockeyShift table extraction and parsing
  - `src/tools/get_schedule.ts` - MCP tool for full team schedules
- Features:
  - Flexible table format support (handles varying column orders)
  - Venue parsing (splits "Facility - Rink" format)
  - Pacific timezone date/time handling
  - Team ID resolution from partial name matches
  - Comprehensive error messages with suggestions

**Removed**
- `get_next_game` tool - Redundant (LLM can filter schedule results)

**Deferred**
- `get_team_stats` - Waiting for SCAHA-MCP implementation
- `get_player_stats` - Waiting for SCAHA-MCP implementation
- `get_schedule_csv` - PGHL platform doesn't support CSV downloads

### Infrastructure
- **npm Package**: `@joerawr/pghl-mcp`
  - CLI executable: `npx @joerawr/pghl-mcp`
  - STDIO transport for Claude Desktop and MCP clients

- **Vercel Deployment**:
  - HTTP transport for remote access
  - StreamableHTTP endpoint: `/api/mcp`
  - Serverless functions with Puppeteer support

- **GitHub**:
  - Repository: https://github.com/joerawr/pghl-mcp
  - Issues and PRs tracked
  - Automated version tagging

### Available Tools (2)

1. **list_schedule_options**
   - Progressive discovery of seasons, divisions, and teams
   - Supports optional filtering by season and division
   - Returns dropdown options as they appear on PGHL website

2. **get_schedule**
   - Retrieves full game schedule for a team
   - Includes dates, times, opponents, venues
   - Supports partial team name matching
   - Returns all games (past and future)

### Technology Stack
- **MCP SDK**: @modelcontextprotocol/sdk v1.18.2
- **Web Scraping**: Puppeteer v24.23.0 + @sparticuz/chromium v140.0.0
- **HTTP Handler**: mcp-handler v1.0.2
- **Framework**: Next.js v15.5.4 (HTTP transport)
- **Date/Time**: date-fns v4.1.0 + @date-fns/tz v1.4.1
- **Validation**: Zod v3.25.76
- **Runtime**: Node.js with TypeScript v5.9.3

### Architecture Highlights
- **87% code reuse** from SCAHA-MCP (exceeds 60% requirement)
- **Dual transport** pattern: same tools work via STDIO and HTTP
- **Progressive discovery** workflow for optimal UX
- **Graceful degradation** with custom error types
- **Pacific timezone** support for accurate game times
- **Manual testing** workflow (no automated tests per constitution)

## Links
- **npm**: https://www.npmjs.com/package/@joerawr/pghl-mcp
- **GitHub**: https://github.com/joerawr/pghl-mcp
- **Vercel**: https://pghl-8okosyss0-joe-rogers-projects.vercel.app
- **Related**: [SCAHA-MCP](https://github.com/joerawr/scaha-mcp)
