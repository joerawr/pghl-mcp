/**
 * get_team_schedule MCP Tool
 * Fetch schedule for a specific team using iCal feed
 */

import { z } from 'zod';
import { fetchScheduleFromICal } from '../scraper/ical-scraper.js';
import { logger } from '../utils/logger.js';

const GetTeamScheduleSchema = z.object({
  team_id: z.string(),
  season_id: z.string().optional(),
});

/**
 * Tool definition for MCP protocol
 */
export const getTeamScheduleTool = {
  definition: {
    name: 'get_team_schedule',
    description:
      'Get the schedule for a specific PGHL team. This is the primary tool for team-specific queries. Returns structured JSON with approximately 16 games for a single team. Use this when the user asks about a specific team\'s schedule.',
    inputSchema: {
      type: 'object',
      properties: {
        team_id: {
          type: 'string',
          description: 'The team ID (e.g., "586889" for Las Vegas Storm 12u AA). Use list_schedule_options to discover team IDs.',
        },
        season_id: {
          type: 'string',
          description: 'Optional season ID (e.g., "9486" for 2025-26 season). Defaults to current season if omitted.',
        },
      },
      required: ['team_id'],
    },
  },

  /**
   * Tool handler - executes the iCal fetch
   */
  async handler(args: unknown) {
    logger.info('Executing get_team_schedule tool');

    try {
      // Validate arguments
      const { team_id, season_id } = GetTeamScheduleSchema.parse(args);

      logger.debug('Tool arguments validated:', { team_id, season_id });

      // Fetch schedule from iCal feed
      const games = await fetchScheduleFromICal({
        teamId: team_id,
        seasonId: season_id,
      });

      if (games.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No games found for team ${team_id}${season_id ? ` in season ${season_id}` : ''}.`,
            },
          ],
        };
      }

      logger.info(`Found ${games.length} games for team ${team_id}`);

      // Return structured JSON data for machine parsing
      const response = {
        games: games,
        metadata: {
          count: games.length,
          team_id: team_id,
          season_id: season_id,
          type: 'team_schedule',
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
      logger.error('get_team_schedule failed:', error);

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
