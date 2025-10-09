<!--
Sync Impact Report:
- Version change: N/A → 1.0.0 (initial constitution)
- Ratification: 2025-10-08 (Capstone project kickoff)
- Modified principles: N/A (initial creation)
- Added sections: All (initial creation)
- Removed sections: None
- Templates requiring updates:
  ✅ plan-template.md - Constitution Check section aligned
  ✅ spec-template.md - Scope constraints aligned
  ✅ tasks-template.md - Capstone deadline awareness aligned
- Follow-up TODOs: None
-->

# PGHL-MCP Constitution

## Core Principles

### I. MCP Protocol First

PGHL-MCP MUST implement the Model Context Protocol (MCP) specification as its primary interface contract. All functionality MUST be exposed through well-defined MCP tools with clear schemas. The server MUST support both STDIO transport (for Claude Desktop, CLI testing) and StreamableHTTP transport (for Vercel deployment and Hockey Go Time integration).

**Rationale**: MCP protocol ensures interoperability with AI agents and standardized tool calling patterns. Dual transport support enables both local development/testing and production deployment without code duplication.

### II. Code Reuse from SCAHA-MCP

PGHL-MCP MUST reuse at least 60% of SCAHA-MCP's architecture, patterns, and code structure. This includes transport layer implementation, MCP protocol handling, error handling patterns, and Puppeteer scraping infrastructure. Divergences from SCAHA-MCP MUST be justified and documented.

**Rationale**: SCAHA-MCP is a proven, working MCP server for youth hockey data. Maximizing code reuse accelerates development, reduces bugs, and maintains consistency across the HockeyGoTime ecosystem. The 60% threshold balances reuse with PGHL-specific adaptations.

### III. Capstone Deadline Priority (NON-NEGOTIABLE)

All development decisions MUST prioritize delivering a demonstrable MVP by 2025-10-25 (Capstone presentation deadline). MVP features (P1 user stories) take absolute precedence over post-MVP enhancements. When faced with trade-offs, choose fewer polished features over many incomplete features. Scope MUST be ruthlessly cut to meet the deadline.

**Rationale**: This is a time-boxed Capstone project for Agent Engineering Bootcamp. Missing the deadline means project failure. The primary goal is demonstrating AI agent capabilities and MCP integration, not feature completeness.

### IV. Testability via CLI

All MCP tools MUST be testable from the command line without requiring external dependencies beyond Chrome browser. STDIO server MUST support manual testing by developers and automated testing via test frameworks. Each tool MUST have clear, documented test scenarios.

**Rationale**: CLI testability enables rapid iteration during development, debugging of scraping logic, and validation of MCP responses without deploying to Vercel or integrating with Hockey Go Time.

### V. Graceful Degradation

PGHL-MCP MUST handle errors gracefully without crashing. Website unavailability, invalid inputs, scraping failures, and timeouts MUST return clear, actionable error messages to users. Zero unhandled exceptions are acceptable during normal operation.

**Rationale**: Web scraping is inherently fragile. The PGHL website may change, be down, or return unexpected data. Users should receive helpful error messages, not stack traces or server crashes.

### VI. Simplicity and YAGNI

Implement only what is specified in MVP requirements. No premature optimization, no speculative features, no gold-plating. Data caching, rate limiting, authentication, and other "nice-to-have" features are explicitly OUT OF SCOPE unless required for Capstone demonstration.

**Rationale**: Limited time (2.5 weeks) demands ruthless focus on core functionality. Every hour spent on non-MVP features risks missing the deadline. Complexity can be added post-Capstone if the project continues.

## Capstone Constraints

**Project Context**: Agent Engineering Bootcamp Capstone
**Deadline**: 2025-10-25 (approximately 2.5 weeks from ratification)
**Deliverable**: Demonstrable MVP showcasing AI agent interaction with PGHL schedule data via MCP protocol

**Time-Sensitive Rules**:

1. **MVP First, Always**: User Stories marked P1 MUST be completed before any P2 or P3 work begins
2. **Feature Freeze**: No new features may be added to MVP scope after 2025-10-15 (one week before presentation)
3. **Demo-Driven Development**: Every feature MUST have a clear demonstration scenario for Capstone presentation
4. **Quality over Quantity**: Prefer two fully working, polished P1 features over four partially complete features
5. **Scope Cutting Authority**: If deadline risk emerges, P2 and P3 features may be cut without discussion

**Out of Scope (Capstone MVP)**:

- Player statistics and team standings (future enhancement)
- Data caching or persistence
- Rate limiting or request throttling
- Authentication or user accounts
- Performance optimization beyond 20-second response time
- Historical data beyond current + one past season
- Mobile app development
- Real-time notifications

## Deployment and Distribution

**NPM Package**: PGHL-MCP MUST be published to npm as `@joerawr/pghl-mcp` (or similar) following the SCAHA-MCP pattern. The package MUST be usable via `npx @joerawr/pghl-mcp` for STDIO transport.

**Vercel Deployment**: PGHL-MCP MUST deploy to Vercel for StreamableHTTP transport. Pushing to `main` branch MUST trigger automatic build and deployment via Vercel integration.

**Hockey Go Time Integration**: PGHL-MCP will be consumed by Hockey Go Time (HGT) web application in a future phase. The MCP tool contracts MUST remain stable to avoid breaking HGT integration.

**Deployment Requirements**:

1. STDIO server MUST work via `npx` without additional configuration (Chrome path as optional env var)
2. StreamableHTTP server MUST be Vercel-deployable with Puppeteer support
3. Both transports MUST return identical data formats (MCP protocol compliance)
4. Environment-specific configuration MUST be externalized (dev, staging, production)

## Development Workflow

**Branching Strategy**:

- `main` branch: Production-ready code, auto-deploys to Vercel
- Feature branches: `###-feature-name` format (e.g., `001-pghl-mcp-will`)
- No direct commits to `main` - all changes via feature branches

**Quality Gates**:

1. All P1 features MUST pass manual CLI testing before merge
2. StreamableHTTP deployment MUST be validated on Vercel staging before merging to `main`
3. No merge to `main` if it would break existing working features
4. Capstone Demo MUST be rehearsed with `main` branch code before presentation

**Testing Expectations**:

- Manual CLI testing is REQUIRED for all MCP tools
- Automated testing is OPTIONAL (not required for Capstone MVP given time constraints)
- Integration testing with Hockey Go Time is OUT OF SCOPE for Capstone

**Documentation Requirements**:

- README.md MUST include: Installation, MCP tool descriptions, CLI testing examples, Deployment instructions
- Each MCP tool MUST have parameter documentation and example usage
- Quickstart guide MUST enable a new developer to test the server in under 10 minutes

## Governance

**Constitution Authority**: This constitution supersedes all other development practices, guidelines, or preferences. When conflicts arise, constitution principles take precedence.

**Amendment Process**:

- MINOR version bump: Adding new principle or expanding existing principle guidance
- PATCH version bump: Clarifications, wording improvements, non-semantic fixes
- MAJOR version bump: Removing or fundamentally changing existing principles (avoid during Capstone)

**Capstone Exception**: Given the 2.5-week timeline, constitutional amendments are DISCOURAGED unless absolutely necessary. Focus on execution, not governance refinement.

**Compliance Verification**:

- Each feature spec MUST include Capstone deadline impact assessment
- Each implementation plan MUST verify compliance with Principle II (60% code reuse from SCAHA-MCP)
- Each task list MUST prioritize P1 features and include MVP completion estimates

**Complexity Justification**: Any deviation from Principle VI (Simplicity and YAGNI) MUST be explicitly justified in planning documents. Examples of complexity requiring justification:

- Adding caching layers
- Implementing authentication
- Creating additional transport mechanisms
- Building admin interfaces
- Adding real-time features

**Version**: 1.0.0 | **Ratified**: 2025-10-08 | **Last Amended**: 2025-10-08
