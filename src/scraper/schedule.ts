/**
 * PGHL schedule scraper
 * Scrapes game schedules from HockeyShift platform
 */

import { Page } from 'puppeteer-core';
import { Game } from '../models/index.js';
import { launchBrowser, createPage, closeBrowser } from './browser.js';
import { navigateToSchedulePage, selectDropdownOption } from './navigation.js';
import { logger } from '../utils/logger.js';
import { parsePGHLDate, parsePGHLTime } from '../utils/date-parser.js';

/**
 * Extract schedule table from PGHL page
 * Returns raw table data as array of row arrays
 */
async function extractScheduleTable(page: Page): Promise<string[][]> {
  logger.debug('Extracting schedule table from page');

  try {
    // Wait for schedule table to be populated
    // HockeyShift typically uses DataTables for schedule display
    await page.waitForSelector('table', { timeout: 10000 });

    // Extract table data using page.evaluate
    const tableData = await page.evaluate(() => {
      // Find the schedule table (look for table with game data)
      const tables = Array.from(document.querySelectorAll('table'));
      let scheduleTable = null;

      for (const table of tables) {
        const headerText = Array.from(table.querySelectorAll('thead th'))
          .map((th) => th.textContent?.trim().toLowerCase() || '')
          .join(' ');

        // Schedule table should have "date" and either "home" or "team" columns
        if (headerText.includes('date') && (headerText.includes('home') || headerText.includes('team'))) {
          scheduleTable = table;
          break;
        }
      }

      if (!scheduleTable) {
        return [];
      }

      const rows: string[][] = [];

      // Get headers
      const headerCells = scheduleTable.querySelectorAll('thead th');
      if (headerCells.length > 0) {
        rows.push(Array.from(headerCells).map((cell) => cell.textContent?.trim() || ''));
      }

      // Get body rows
      const bodyRows = scheduleTable.querySelectorAll('tbody tr');
      bodyRows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
          rows.push(
            Array.from(cells).map((cell) => {
              const text = cell.textContent?.trim() || '';

              // Clean up team names that have duplicated short codes
              // Pattern: "Team Name 12u AA" followed by "TeamCode12AA"
              // Match: "LA Lions 12u AALions12AA" -> "LA Lions 12u AA"
              const cleanedText = text.replace(/^(.*?\d+u\s+[A]+)([A-Za-z0-9]+)$/, '$1');

              return cleanedText;
            })
          );
        }
      });

      return rows;
    });

    logger.debug(`Extracted ${tableData.length} rows from schedule table`);
    return tableData;
  } catch (error) {
    logger.error('Failed to extract schedule table:', error);
    throw new Error('Could not find schedule table on page');
  }
}

/**
 * Clean team name by removing game description and duplicate codes
 * Patterns to remove:
 * - Full game description: "Team1 vs Team2 on Date TimeTeamCode"
 * - Duplicate short code: "Team Name 12u AATeamCode12AA"
 */
function cleanTeamName(rawText: string): string {
  let text = rawText.trim();

  // Pattern 1: Remove game description (everything from " vs " onwards)
  // "LA Lions 12u AA vs Anaheim Lady Ducks 12u AA on 10/18/25 11:00 AMLA Lions 12u AA"
  // -> "LA Lions 12u AA"
  if (text.includes(' vs ')) {
    const matchLast = text.match(/([^]+?)\s*$/);
    if (matchLast) {
      // The team name is likely the last occurrence before the short code
      // Pattern: everything before " vs " OR the very last team name after the date/time
      const parts = text.split(' vs ');
      if (parts.length > 0) {
        // Try to extract the first team name (before " vs ")
        text = parts[0].trim();
      }
    }
  }

  // Pattern 2: Remove duplicate short code at the end
  // "LA Lions 12u AALions12AA" -> "LA Lions 12u AA"
  text = text.replace(/^(.*?\d+u\s+[A]+)[A-Za-z0-9]+$/, '$1');

  return text.trim();
}

/**
 * Parse PGHL schedule table into Game objects
 * PGHL table format (typical HockeyShift): Date, Time, Home, Away, Venue, Rink, Status
 */
function parseScheduleTable(tableData: string[][], division: string, season: string): Game[] {
  if (tableData.length < 2) {
    logger.warn('No schedule data found in table');
    return [];
  }

  const headers = tableData[0].map((h) => h.toLowerCase());
  const dataRows = tableData.slice(1);

  // Find column indices (HockeyShift column order may vary)
  const dateIdx = headers.findIndex((h) => h.includes('date'));
  const timeIdx = headers.findIndex((h) => h.includes('time'));
  const homeIdx = headers.findIndex((h) => h.includes('home'));
  const awayIdx = headers.findIndex((h) => h.includes('away') || h.includes('visitor'));
  const venueIdx = headers.findIndex((h) => h.includes('venue') || h.includes('location') || h.includes('rink'));
  const statusIdx = headers.findIndex((h) => h.includes('status') || h.includes('result'));

  if (dateIdx === -1 || homeIdx === -1 || awayIdx === -1) {
    logger.error('Could not find required columns in schedule table', { headers });
    throw new Error('Schedule table format not recognized');
  }

  const games: Game[] = [];

  for (const row of dataRows) {
    try {
      const dateStr = row[dateIdx] || '';
      const timeStr = row[timeIdx] || '';
      const homeRaw = row[homeIdx] || '';
      const awayRaw = row[awayIdx] || '';
      const venue = venueIdx >= 0 ? row[venueIdx] || '' : '';
      const status = statusIdx >= 0 ? row[statusIdx] || '' : '';

      // Clean team names (remove game descriptions and duplicate codes)
      const home = cleanTeamName(homeRaw);
      const away = cleanTeamName(awayRaw);

      // Skip empty rows or header rows
      if (!dateStr || !home || !away) continue;
      if (home.toLowerCase() === 'home' || dateStr.toLowerCase() === 'date') continue;

      // Parse date and time
      const date = parsePGHLDate(dateStr, season);
      const time = timeStr ? parsePGHLTime(timeStr) : '';

      // Extract venue and rink
      // PGHL format is often "Facility Name - Rink Name" or just "Facility Name"
      let venueName = venue;
      let rinkName = '';

      if (venue.includes(' - ')) {
        const parts = venue.split(' - ');
        venueName = parts[0].trim();
        rinkName = parts.slice(1).join(' - ').trim();
      }

      const game: Game = {
        date,
        time,
        home,
        away,
        venue: venueName,
        division,
      };

      // Add optional fields if present
      if (rinkName) {
        game.rink = rinkName;
      }
      if (status) {
        game.status = status;
      }

      games.push(game);
    } catch (error) {
      logger.warn('Failed to parse schedule row:', { row, error });
      // Continue with next row
    }
  }

  logger.info(`Parsed ${games.length} games from schedule table`);
  return games;
}

/**
 * Scrape schedule for a division (all teams or specific team)
 *
 * @param seasonId - Season ID (e.g., "number:9486")
 * @param divisionId - Division ID (e.g., "number:42897")
 * @param teamId - Team ID (e.g., "number:586889") or null for all teams
 * @param season - Season string for date parsing (e.g., "2025-26")
 * @param division - Division string for game metadata (e.g., "12u AA")
 * @param scope - 'current' for upcoming games, 'full' for all games (default: 'current')
 * @returns Array of Game objects
 */
export async function scrapeSchedule(
  seasonId: string,
  divisionId: string,
  teamId: string | null,
  season: string,
  division: string,
  scope: 'current' | 'full' = 'current'
): Promise<Game[]> {
  logger.info('Scraping PGHL schedule', { seasonId, divisionId, teamId, scope });

  const browser = await launchBrowser();

  try {
    const page = await createPage(browser);

    // Navigate to schedule page with season AND division pre-selected via URL parameters
    // This bypasses ALL dropdown selection, which is more reliable on serverless
    await navigateToSchedulePage(page, seasonId, divisionId);

    // No need to select season or division from dropdowns - already selected via URL parameters
    logger.debug('Season and division pre-selected via URL, skipping dropdown selection');

    // Team selection: Only needed if filtering to specific team
    // When teamId is null, URL parameters default to "All Teams" automatically
    if (teamId) {
      logger.debug(`Selecting specific team: ${teamId}`);
      const teamSelectors = [
        'select[ng-model*="team"]',
        'select[name="team"]',
        'select#team',
      ];

      for (const selector of teamSelectors) {
        try {
          await selectDropdownOption(page, selector, teamId, 'team');
          break;
        } catch (error) {
          // If team selection fails, continue anyway - URL params may have handled it
          logger.warn(`Could not select team via dropdown: ${error}`);
          continue;
        }
      }
    } else {
      // No teamId provided - URL parameters will default to "All Teams"
      logger.debug('No team filter - showing all teams in division (via URL default)');
    }

    // Select scope: CURRENT SCHEDULE or FULL SCHEDULE
    // Look for a link, button, or tab that switches between current and full
    if (scope === 'current') {
      logger.debug('Looking for "Current Schedule" option');
      try {
        // Common patterns for current schedule links/buttons
        await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a, button, [role="tab"]'));
          const currentLink = links.find((el) =>
            el.textContent?.toLowerCase().includes('current')
          ) as HTMLElement;

          if (currentLink) {
            currentLink.click();
          }
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        logger.debug('Could not find "Current Schedule" link, using default view');
      }
    } else {
      logger.debug('Looking for "Full Schedule" option');
      try {
        await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a, button, [role="tab"]'));
          const fullLink = links.find((el) =>
            el.textContent?.toLowerCase().includes('full')
          ) as HTMLElement;

          if (fullLink) {
            fullLink.click();
          }
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        logger.debug('Could not find "Full Schedule" link, using default view');
      }
    }

    // Wait for schedule table to populate
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Extract schedule table
    const tableData = await extractScheduleTable(page);

    // Parse into Game objects
    const games = parseScheduleTable(tableData, division, season);

    logger.info(`Successfully scraped ${games.length} games`);
    return games;
  } catch (error) {
    logger.error('Failed to scrape schedule:', error);
    throw error;
  } finally {
    await closeBrowser(browser);
  }
}
