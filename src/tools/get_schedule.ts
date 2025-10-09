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

/**
 * Tool definition for MCP protocol
 */
export const getScheduleTool = {
  definition: {
    name: 'get_schedule',
    description:
      'Get the full game schedule for a PGHL team. Returns all games (past and future) for the specified team, including dates, opponents, venues, and game status. Use list_schedule_options first to discover available seasons, divisions, and teams.',
    inputSchema: {
      type: 'object',
      properties: {
        season: {
          type: 'string',
          description:
            "Season in YYYY-YY format (e.g., '2025-26'). Use list_schedule_options to discover available seasons.",
        },
        division: {
          type: 'string',
          description:
            "Division name (e.g., '12u AA', '14u AA'). Use list_schedule_options with season to discover available divisions.",
        },
        team: {
          type: 'string',
          description:
            "Team name (e.g., 'Las Vegas Storm 12u AA'). Use list_schedule_options with season and division to discover available teams. Partial matches supported.",
        },
      },
      required: ['season', 'division', 'team'],
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

      const { season, division, team } = validatedArgs;

      // First, discover available options to get IDs
      logger.debug('Discovering team options to find team ID');

      // Convert season format: "2025-26" → try to find matching option
      // We need to call discovery to get the actual season ID
      const allSeasons = await getScheduleOptions();

      // Find season by matching label (e.g., "2025-26 12u-19u AA")
      const seasonOption = allSeasons.seasons.find(
        (s) => s.label.toLowerCase().includes(season.toLowerCase())
      );

      if (!seasonOption) {
        throw new Error(
          `Season "${season}" not found. Available seasons:\n${allSeasons.seasons.map((s) => `- ${s.label}`).join('\n')}`
        );
      }

      // Get divisions for this season
      const divisionOptions = await getScheduleOptions(seasonOption.value);
      const divisionOption = divisionOptions.divisions.find(
        (d) => d.label.toLowerCase() === division.toLowerCase()
      );

      if (!divisionOption) {
        const availableDivisions = divisionOptions.divisions.map((d) => d.label);
        throw new Error(
          `Division "${division}" not found for season "${season}". Available divisions:\n${availableDivisions.map((d) => `- ${d}`).join('\n')}`
        );
      }

      // Get teams for this division
      const teamOptions = await getScheduleOptions(seasonOption.value, divisionOption.value);

      // Find team by name (support partial matching)
      const normalizedTeamQuery = normalizeTeamName(team);
      const teamOption = teamOptions.teams.find(
        (t) => normalizeTeamName(t.label).includes(normalizedTeamQuery)
      ) || teamOptions.teams.find(
        (t) => normalizeTeamName(t.label).includes(team.toLowerCase())
      );

      if (!teamOption) {
        const availableTeams = teamOptions.teams.map((t) => t.label);
        throw new TeamNotFoundError(team, division, season, availableTeams);
      }

      logger.info(`Found team: ${teamOption.label}`, {
        seasonId: seasonOption.value,
        divisionId: divisionOption.value,
        teamId: teamOption.value,
      });

      // Scrape the schedule
      const games = await scrapeSchedule(
        seasonOption.value,
        divisionOption.value,
        teamOption.value,
        season,
        division
      );

      // Format response
      const response = {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                team: teamOption.label,
                season: seasonOption.label,
                division: divisionOption.label,
                games,
                totalGames: games.length,
              },
              null,
              2
            ),
          },
        ],
      };

      logger.info('get_schedule completed successfully', {
        team: teamOption.label,
        gamesCount: games.length,
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
