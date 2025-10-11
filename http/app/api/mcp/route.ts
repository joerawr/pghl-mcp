/**
 * PGHL MCP Server - HTTP Transport
 *
 * Implements HTTP transport for remote MCP server deployment.
 *
 * This provides HTTP/Streamable HTTP access to the same PGHL tools
 * available via STDIO transport (src/index.ts).
 *
 * Architecture:
 * - Uses mcp-handler to wrap existing tool implementations
 * - All tools are defined in src/tools/ and work with both transports
 * - Enables serverless deployment while maintaining STDIO compatibility
 */

import { createMcpHandler } from 'mcp-handler';
import {
  GetTeamScheduleArgsSchema,
  GetDivisionScheduleArgsSchema,
  ListScheduleOptionsArgsSchema,
} from '../../../../src/mcp/schemas.js';
import { getTeamScheduleTool } from '../../../../src/tools/get_team_schedule.js';
import { getDivisionScheduleTool } from '../../../../src/tools/get_division_schedule.js';
import { listScheduleOptionsTool } from '../../../../src/tools/list_schedule_options.js';

/**
 * Some transports (including Streamable HTTP) wrap tool arguments under an
 * `arguments` key. Normalise so the existing tool handlers keep working.
 */
function resolveToolArgs(args: unknown): unknown {
  if (
    args &&
    typeof args === 'object' &&
    'arguments' in (args as Record<string, unknown>) &&
    typeof (args as Record<string, unknown>).arguments === 'object' &&
    (args as Record<string, unknown>).arguments !== null
  ) {
    return (args as { arguments: unknown }).arguments;
  }

  if (
    args &&
    typeof args === 'object' &&
    'requestInfo' in (args as Record<string, unknown>)
  ) {
    const requestInfo = (args as { requestInfo?: Record<string, unknown> })
      .requestInfo;
    const body = requestInfo?.body;

    if (typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        if (
          parsed &&
          typeof parsed === 'object' &&
          'params' in parsed &&
          typeof parsed.params === 'object' &&
          parsed.params !== null &&
          'arguments' in parsed.params
        ) {
          return parsed.params.arguments;
        }
      } catch (error) {
        console.error('[pghl-mcp] Failed to parse request body:', error);
      }
    }
  }

  return args;
}

// Issue #2: HTTP transport wraps existing tool implementations
// All tools are imported from src/tools/ and work with both STDIO and HTTP transports
const handler = createMcpHandler(
  (server) => {
    // Register get_team_schedule tool
    server.tool(
      getTeamScheduleTool.definition.name,
      getTeamScheduleTool.definition.description || '',
      GetTeamScheduleArgsSchema.shape,
      async (args) => {
        const result = await getTeamScheduleTool.handler(resolveToolArgs(args));
        return result as any;
      }
    );

    // Register get_division_schedule tool
    server.tool(
      getDivisionScheduleTool.definition.name,
      getDivisionScheduleTool.definition.description || '',
      GetDivisionScheduleArgsSchema.shape,
      async (args) => {
        const result = await getDivisionScheduleTool.handler(resolveToolArgs(args));
        return result as any;
      }
    );

    // Register list_schedule_options tool
    server.tool(
      listScheduleOptionsTool.definition.name,
      listScheduleOptionsTool.definition.description || '',
      ListScheduleOptionsArgsSchema.shape,
      async (args) => {
        const result = await listScheduleOptionsTool.handler(
          resolveToolArgs(args)
        );
        return result as any;
      }
    );
  },
  {
    serverInfo: {
      name: 'pghl-mcp',
      version: '0.1.1',
    },
  },
  { basePath: '/api' }
);

export { handler as GET, handler as POST, handler as DELETE };
