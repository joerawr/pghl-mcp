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
          rows.push(Array.from(cells).map((cell) => cell.textContent?.trim() || ''));
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
      const home = row[homeIdx] || '';
      const away = row[awayIdx] || '';
      const venue = venueIdx >= 0 ? row[venueIdx] || '' : '';
      const status = statusIdx >= 0 ? row[statusIdx] || '' : '';

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
 * Scrape schedule for a specific team
 *
 * @param seasonId - Season ID (e.g., "number:9486")
 * @param divisionId - Division ID (e.g., "number:42897")
 * @param teamId - Team ID (e.g., "number:586889")
 * @param season - Season string for date parsing (e.g., "2025-26")
 * @param division - Division string for game metadata (e.g., "12u AA")
 * @returns Array of Game objects
 */
export async function scrapeSchedule(
  seasonId: string,
  divisionId: string,
  teamId: string,
  season: string,
  division: string
): Promise<Game[]> {
  logger.info('Scraping PGHL schedule', { seasonId, divisionId, teamId });

  const browser = await launchBrowser();

  try {
    const page = await createPage(browser);

    // Navigate to schedule page
    await navigateToSchedulePage(page);

    // Select season
    const seasonSelectors = [
      'select[ng-model*="season"]',
      'select[name="season"]',
      'select#season',
    ];

    for (const selector of seasonSelectors) {
      try {
        await selectDropdownOption(page, selector, seasonId, 'season');
        break;
      } catch (error) {
        continue;
      }
    }

    // Select division
    const divisionSelectors = [
      'select[ng-model*="division"]',
      'select[name="division"]',
      'select#division',
    ];

    for (const selector of divisionSelectors) {
      try {
        await selectDropdownOption(page, selector, divisionId, 'division');
        break;
      } catch (error) {
        continue;
      }
    }

    // Select team
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
        continue;
      }
    }

    // Wait for schedule table to populate after team selection
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
