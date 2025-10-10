/**
 * get_schedule MCP Tool
 * Retrieve full game schedule for a team in PGHL
 */

import { GetScheduleArgsSchema } from '../mcp/schemas.js';
import { scrapeSchedule } from '../scraper/schedule.js';
import { getScheduleOptions } from '../scraper/discovery.js';
import { logger } from '../utils/logger.js';
import { normalizeTeamName } from '../utils/date-parser.js';
import { TeamNotFoundError } from '../utils/errors.js';
import { getSeasonId, getSeasonLabel } from '../utils/season-mapper.js';

/**
 * Tool definition for MCP protocol
 */
export const getScheduleTool = {
  definition: {
    name: 'get_schedule',
    description:
      'Get game schedule for a PGHL division. Returns games for ALL teams in the division by default (faster, recommended). Optionally filter to a specific team. Use "current" scope for upcoming games only, or "full" for complete season history.',
    inputSchema: {
      type: 'object',
      properties: {
        season: {
          type: 'string',
          description:
            "Season in flexible format: '2025-26', '2025/26', '2025-2026', or full format '2025-26 12u-19u AA'. Automatically maps to correct season based on division tier.",
        },
        division: {
          type: 'string',
          description:
            "Division name (e.g., '12u AA', '14u AA'). Use list_schedule_options with season to discover available divisions.",
        },
        scope: {
          type: 'string',
          enum: ['current', 'full'],
          description:
            "Scope of schedule: 'current' for upcoming games only (default), 'full' for all games past and future.",
          default: 'current',
        },
        team: {
          type: 'string',
          description:
            "Optional: Filter to specific team. If omitted, returns ALL games in the division (recommended - let the agent filter). Partial matches supported.",
        },
      },
      required: ['season', 'division'],
    },
  },

  /**
   * Tool handler - executes the schedule scraping
   */
  async handler(args: unknown) {
    logger.info('Executing get_schedule tool');

    try {
      // Validate arguments
      const validatedArgs = GetScheduleArgsSchema.parse(args);

      logger.debug('Tool arguments validated:', validatedArgs);

      const { season, division, scope = 'current', team } = validatedArgs;

      // Map season format to season ID using division tier
      // Supports formats: "2025-26", "2025/26", "2025-26 12u-19u AA", etc.
      const seasonId = getSeasonId(season, division);
      const seasonLabel = getSeasonLabel(season, division);

      logger.info(`Resolved season "${season}" to ID: ${seasonId}, label: ${seasonLabel}`);

      // Get divisions for this season (pass label, not value)
      const divisionOptions = await getScheduleOptions(seasonLabel);
      const divisionOption = divisionOptions.divisions.find(
        (d) => d.label.toLowerCase() === division.toLowerCase()
      );

      if (!divisionOption) {
        const availableDivisions = divisionOptions.divisions.map((d) => d.label);
        throw new Error(
          `Division "${division}" not found for season "${season}". Available divisions:\n${availableDivisions.map((d) => `- ${d}`).join('\n')}`
        );
      }

      logger.info(`Fetching ${scope} schedule for division`, {
        season: seasonLabel,
        division: divisionOption.label,
        scope,
      });

      // Scrape the schedule for the entire division (no team selection)
      const games = await scrapeSchedule(
        seasonId,
        divisionOption.value,
        null, // No team selection - get all games
        season,
        division,
        scope
      );

      // Filter to specific team if requested (let agent do this if not specified)
      let filteredGames = games;
      let teamFilter: string | undefined;

      if (team) {
        const normalizedTeamQuery = normalizeTeamName(team);
        filteredGames = games.filter((game) => {
          const homeMatch = normalizeTeamName(game.home).includes(normalizedTeamQuery);
          const awayMatch = normalizeTeamName(game.away).includes(normalizedTeamQuery);
          return homeMatch || awayMatch;
        });

        teamFilter = team;
        logger.info(`Filtered to ${filteredGames.length} games for team: ${team}`);
      }

      // Format response
      const response = {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                season: seasonLabel,
                division: divisionOption.label,
                scope,
                ...(teamFilter && { teamFilter }),
                games: filteredGames,
                totalGames: filteredGames.length,
                ...(teamFilter && { totalDivisionGames: games.length }),
              },
              null,
              2
            ),
          },
        ],
      };

      logger.info('get_schedule completed successfully', {
        scope,
        totalGames: games.length,
        filteredGames: filteredGames.length,
      });

      return response;
    } catch (error) {
      logger.error('get_schedule failed:', error);

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
