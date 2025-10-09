/**
 * PGHL MCP Server - Tool Registration
 *
 * Registers all MCP tools and handles tool execution requests.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from './utils/logger.js';

// Tool imports will be added as tools are implemented
// import { getScheduleTool } from './tools/get_schedule.js';
// import { getNextGameTool } from './tools/get_next_game.js';
// import { listScheduleOptionsTool } from './tools/list_schedule_options.js';

/**
 * Register all PGHL tools with the MCP server
 */
export function registerTools(server: Server) {
  // List all available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('Handling ListToolsRequest');

    return {
      tools: [
        // Tools will be added here as they're implemented in Phase 3 and 4
        // getScheduleTool.definition,
        // getNextGameTool.definition,
        // listScheduleOptionsTool.definition,
      ],
    };
  });

  // Handle tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    logger.info(`Executing tool: ${name}`);
    logger.debug(`Tool arguments:`, args);

    try {
      switch (name) {
        // Tool cases will be added here as they're implemented
        // case 'get_schedule':
        //   return await getScheduleTool.handler(args);
        // case 'get_next_game':
        //   return await getNextGameTool.handler(args);
        // case 'list_schedule_options':
        //   return await listScheduleOptionsTool.handler(args);

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      // Log error to stderr (stdout is reserved for MCP protocol)
      logger.error(`Error executing tool "${name}":`, error);

      // Return structured error response
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  });

  logger.info('Tool registration complete');
}
