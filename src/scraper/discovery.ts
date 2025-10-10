/**
 * PGHL discovery scraper
 * Provides progressive discovery of seasons, divisions, and teams
 */

import { ScheduleOptions, SelectOption } from '../models/index.js';
import { launchBrowser, createPage, closeBrowser } from './browser.js';
import { getSeasonOptions, getDivisionOptions, getTeamOptions } from './navigation.js';
import { logger } from '../utils/logger.js';

/**
 * Find a SelectOption by label (case-insensitive, partial match)
 */
function findOptionByLabel(options: SelectOption[], label: string): SelectOption | undefined {
  const normalizedLabel = label.toLowerCase().trim();

  // Try exact match first
  const exactMatch = options.find(opt => opt.label.toLowerCase() === normalizedLabel);
  if (exactMatch) return exactMatch;

  // Try partial match
  return options.find(opt => opt.label.toLowerCase().includes(normalizedLabel));
}

/**
 * Get schedule options (seasons, divisions, teams) with progressive discovery
 *
 * @param seasonLabel - Optional season label (e.g., "2025-26") to get divisions
 * @param divisionLabel - Optional division label (e.g., "12u AA") to get teams (requires season)
 * @returns ScheduleOptions with available seasons, divisions, and teams
 */
export async function getScheduleOptions(
  seasonLabel?: string,
  divisionLabel?: string
): Promise<ScheduleOptions> {
  logger.info('Getting schedule options', { season: seasonLabel, division: divisionLabel });

  const browser = await launchBrowser();

  try {
    const page = await createPage(browser);

    // Always get seasons
    const seasons = await getSeasonOptions(page);
    logger.debug(`Retrieved ${seasons.length} seasons`);

    // Resolve season label to value
    let seasonValue: string | undefined;
    if (seasonLabel) {
      const seasonOption = findOptionByLabel(seasons, seasonLabel);
      if (seasonOption) {
        seasonValue = seasonOption.value;
        logger.debug(`Resolved season label "${seasonLabel}" to value "${seasonValue}"`);

        // Mark as selected
        seasons.forEach((s) => {
          s.selected = s.value === seasonValue;
        });
      } else {
        logger.warn(`Season label "${seasonLabel}" not found in available seasons`);
      }
    }

    // Get divisions if season provided
    let divisions: SelectOption[] = [];
    if (seasonValue) {
      logger.debug(`Getting divisions for season: ${seasonValue}`);
      divisions = await getDivisionOptions(page, seasonValue);
      logger.debug(`Retrieved ${divisions.length} divisions`);

      // Resolve division label to value
      let divisionValue: string | undefined;
      if (divisionLabel) {
        const divisionOption = findOptionByLabel(divisions, divisionLabel);
        if (divisionOption) {
          divisionValue = divisionOption.value;
          logger.debug(`Resolved division label "${divisionLabel}" to value "${divisionValue}"`);

          // Mark as selected
          divisions.forEach((d) => {
            d.selected = d.value === divisionValue;
          });
        } else {
          logger.warn(`Division label "${divisionLabel}" not found in available divisions`);
        }
      }

      // Get teams if division resolved
      let teams: SelectOption[] = [];
      if (divisionValue) {
        logger.debug(`Getting teams for season: ${seasonValue}, division: ${divisionValue}`);
        teams = await getTeamOptions(page, seasonValue, divisionValue);
        logger.debug(`Retrieved ${teams.length} teams`);

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
      }
    }

    const result: ScheduleOptions = {
      seasons,
      divisions,
      teams: [],
    };

    logger.info('Schedule options retrieved successfully', {
      seasonsCount: seasons.length,
      divisionsCount: divisions.length,
      teamsCount: 0,
    });

    return result;
  } catch (error) {
    logger.error('Failed to get schedule options:', error);
    throw error;
  } finally {
    await closeBrowser(browser);
  }
}
