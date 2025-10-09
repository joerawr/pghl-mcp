/**
 * PGHL discovery scraper
 * Provides progressive discovery of seasons, divisions, and teams
 */

import { ScheduleOptions, SelectOption } from '../models/index.js';
import { launchBrowser, createPage, closeBrowser } from './browser.js';
import { getSeasonOptions, getDivisionOptions, getTeamOptions } from './navigation.js';
import { logger } from '../utils/logger.js';

/**
 * Get schedule options (seasons, divisions, teams) with progressive discovery
 *
 * @param season - Optional season ID to get divisions
 * @param division - Optional division ID to get teams (requires season)
 * @returns ScheduleOptions with available seasons, divisions, and teams
 */
export async function getScheduleOptions(
  season?: string,
  division?: string
): Promise<ScheduleOptions> {
  logger.info('Getting schedule options', { season, division });

  const browser = await launchBrowser();

  try {
    const page = await createPage(browser);

    // Always get seasons
    const seasons = await getSeasonOptions(page);
    logger.debug(`Retrieved ${seasons.length} seasons`);

    // Mark selected season
    if (season) {
      seasons.forEach((s) => {
        s.selected = s.value === season;
      });
    }

    // Get divisions if season provided
    let divisions: SelectOption[] = [];
    if (season) {
      logger.debug(`Getting divisions for season: ${season}`);
      divisions = await getDivisionOptions(page, season);
      logger.debug(`Retrieved ${divisions.length} divisions`);

      // Mark selected division
      if (division) {
        divisions.forEach((d) => {
          d.selected = d.value === division;
        });
      }
    }

    // Get teams if both season and division provided
    let teams: SelectOption[] = [];
    if (season && division) {
      logger.debug(`Getting teams for season: ${season}, division: ${division}`);
      teams = await getTeamOptions(page, season, division);
      logger.debug(`Retrieved ${teams.length} teams`);
    }

    const result: ScheduleOptions = {
      seasons,
      divisions,
      teams,
    };

    logger.info('Schedule options retrieved successfully', {
      seasonsCount: seasons.length,
      divisionsCount: divisions.length,
      teamsCount: teams.length,
    });

    return result;
  } catch (error) {
    logger.error('Failed to get schedule options:', error);
    throw error;
  } finally {
    await closeBrowser(browser);
  }
}
