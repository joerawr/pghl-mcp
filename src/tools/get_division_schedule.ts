/**
 * get_division_schedule MCP Tool
 * Fetch full season schedule (all teams) or division-specific schedule using iCal feed
 */

import { z } from 'zod';
import { fetchScheduleFromICal } from '../scraper/ical-scraper.js';
import { logger } from '../utils/logger.js';

const GetDivisionScheduleSchema = z.object({
  season_id: z.string(),
  division_id: z.string().optional(),
});

/**
 * Tool definition for MCP protocol
 */
export const getDivisionScheduleTool = {
  definition: {
    name: 'get_division_schedule',
    description:
      'Get the full season schedule for all teams or a specific division in PGHL. Returns structured JSON with approximately 216 games for a full season. Use this for broader queries like "Show me all 12u AA games this weekend" or "What\'s happening across the league?" Use get_team_schedule for team-specific queries instead.',
    inputSchema: {
      type: 'object',
      properties: {
        season_id: {
          type: 'string',
          description: 'The season ID (e.g., "9486" for 2025-26 season). Use list_schedule_options to discover season IDs.',
        },
        division_id: {
          type: 'string',
          description: 'Optional division ID to filter results. If omitted, returns all games for the entire season across all divisions.',
        },
      },
      required: ['season_id'],
    },
  },

  /**
   * Tool handler - executes the iCal fetch
   */
  async handler(args: unknown) {
    logger.info('Executing get_division_schedule tool');

    try {
      // Validate arguments
      const { season_id, division_id } = GetDivisionScheduleSchema.parse(args);

      logger.debug('Tool arguments validated:', { season_id, division_id });

      // Fetch schedule from iCal feed
      const games = await fetchScheduleFromICal({
        seasonId: season_id,
        divisionId: division_id,
      });

      if (games.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No games found for season ${season_id}${division_id ? ` in division ${division_id}` : ''}.`,
            },
          ],
        };
      }

      logger.info(`Found ${games.length} games`);

      // Return structured JSON data for machine parsing
      const response = {
        games: games,
        metadata: {
          count: games.length,
          season_id: season_id,
          division_id: division_id,
          type: division_id ? 'division_schedule' : 'full_season_schedule',
        },
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
      };

    } catch (error) {
      logger.error('get_division_schedule failed:', error);

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
