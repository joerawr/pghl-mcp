/**
 * list_schedule_options MCP Tool
 * Discover available seasons, divisions, and teams in PGHL
 */

import { ListScheduleOptionsArgsSchema } from '../mcp/schemas.js';
import { getScheduleOptions } from '../scraper/discovery.js';
import { logger } from '../utils/logger.js';

/**
 * Tool definition for MCP protocol
 */
export const listScheduleOptionsTool = {
  definition: {
    name: 'list_schedule_options',
    description:
      'Discover available seasons, divisions, and teams in PGHL (Pacific Girls Hockey League). Use this tool to explore what data is available before querying schedules. Supports progressive discovery: provide season to get divisions, provide season+division to get teams. Returns dropdown options as they appear on the PGHL website.',
    inputSchema: {
      type: 'object',
      properties: {
        season: {
          type: 'string',
          description:
            "Optional season filter in YYYY-YY format (e.g., '2025-26'). If provided, the divisions array will be populated with divisions available in this season. If omitted, only seasons array is populated.",
        },
        division: {
          type: 'string',
          description:
            "Optional division filter (e.g., '12u AA'). Requires season parameter. If provided, the teams array will be populated with teams in this division. If omitted, teams array is empty.",
        },
      },
    },
  },

  /**
   * Tool handler - executes the discovery scraping
   */
  async handler(args: unknown) {
    logger.info('Executing list_schedule_options tool');

    try {
      // Validate arguments
      const validatedArgs = ListScheduleOptionsArgsSchema.parse(args);

      logger.debug('Tool arguments validated:', validatedArgs);

      // Execute discovery
      const options = await getScheduleOptions(
        validatedArgs.season,
        validatedArgs.division
      );

      // Format response
      const response = {
        content: [
          {
            type: 'text',
            text: JSON.stringify(options, null, 2),
          },
        ],
      };

      logger.info('list_schedule_options completed successfully', {
        seasonsCount: options.seasons.length,
        divisionsCount: options.divisions.length,
        teamsCount: options.teams.length,
      });

      return response;
    } catch (error) {
      logger.error('list_schedule_options failed:', error);

      // Return error response
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
};
