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
 * @param seasonId - Optional season ID for URL navigation (e.g., "number:9486")
 * @returns ScheduleOptions with available seasons, divisions, and teams
 */
export async function getScheduleOptions(
  seasonLabel?: string,
  divisionLabel?: string,
  seasonId?: string
): Promise<ScheduleOptions> {
  logger.info('Getting schedule options', { season: seasonLabel, division: divisionLabel, seasonId });

  const browser = await launchBrowser();

  try {
    const page = await createPage(browser);

    // Navigate ONCE to the schedule page with optional season pre-selected
    const seasons = await getSeasonOptions(page, seasonId);
    logger.debug(`Retrieved ${seasons.length} seasons`);

    let divisions: SelectOption[] = [];
    let teams: SelectOption[] = [];

    // If season requested, select it and get divisions
    if (seasonLabel) {
      const seasonOption = findOptionByLabel(seasons, seasonLabel);
      if (seasonOption) {
        logger.debug(`Resolved season label "${seasonLabel}" to value "${seasonOption.value}"`);

        // Mark as selected
        seasons.forEach((s) => {
          s.selected = s.value === seasonOption.value;
        });

        // Get divisions WITHOUT reloading page
        divisions = await getDivisionOptions(page, seasonOption.value);
        logger.debug(`Retrieved ${divisions.length} divisions`);

        // If division requested, select it and get teams
        if (divisionLabel && divisions.length > 0) {
          const divisionOption = findOptionByLabel(divisions, divisionLabel);
          if (divisionOption) {
            logger.debug(`Resolved division label "${divisionLabel}" to value "${divisionOption.value}"`);

            // Mark as selected
            divisions.forEach((d) => {
              d.selected = d.value === divisionOption.value;
            });

            // Get teams WITHOUT reloading page
            teams = await getTeamOptions(page, seasonOption.value, divisionOption.value);
            logger.debug(`Retrieved ${teams.length} teams`);
          } else {
            logger.warn(`Division label "${divisionLabel}" not found in available divisions`);
          }
        }
      } else {
        logger.warn(`Season label "${seasonLabel}" not found in available seasons`);
      }
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
