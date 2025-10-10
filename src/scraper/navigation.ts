/**
 * PGHL website navigation scraper
 * Handles interaction with HockeyShift platform dropdowns (Season → Division → Team)
 */

import { Page } from 'puppeteer-core';
import { SelectOption } from '../models/index.js';
import { logger } from '../utils/logger.js';
import { ScrapingError, WebsiteUnavailableError } from '../utils/errors.js';

const PGHL_SCHEDULE_URL = process.env.PGHL_WEBSITE_URL || 'https://www.pacificgirlshockey.com';
const PGHL_LEAGUE_ID = '1447';

/**
 * Wait for a specified amount of time
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for Angular to be ready by checking for ng-scope class
 */
async function waitForAngular(page: Page, requireSelects: boolean = true): Promise<void> {
  try {
    // Log current URL for debugging
    const currentUrl = page.url();
    logger.debug(`Current page URL: ${currentUrl}`);

    // Get page title for debugging
    const title = await page.title();
    logger.debug(`Page title: ${title}`);

    // Wait for Angular to bootstrap (ng-scope is added when Angular initializes)
    await page.waitForSelector('[ng-app]', { timeout: 15000 });
    logger.debug('Found [ng-app] element');

    // Additional wait for Angular to finish rendering
    await delay(3000);

    // Only check for select elements if required (not needed when bypassing via URL params)
    if (requireSelects) {
      // Try to wait for any select element to appear (common on schedule page)
      try {
        await page.waitForSelector('select', { timeout: 10000 });
        logger.debug('Found select element');
      } catch {
        // If no select found, dump page HTML for debugging
        const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
        logger.error('No select elements found after Angular load. Page HTML sample:', bodyHTML);
        throw new Error('No select elements found - page may not have loaded correctly');
      }
    } else {
      logger.debug('Skipping select element check (using URL parameters)');
    }

    logger.debug('Angular appears to be ready');
  } catch (error) {
    logger.error('Angular readiness check failed:', error);
    throw error;
  }
}

/**
 * Navigate to PGHL schedule page and wait for Angular to render
 *
 * @param page - Puppeteer page instance
 * @param seasonId - Optional season ID to pre-select (e.g., "9486")
 */
export async function navigateToSchedulePage(page: Page, seasonId?: string): Promise<void> {
  let url = `${PGHL_SCHEDULE_URL}/stats#/${PGHL_LEAGUE_ID}/schedule`;

  // Add season_id parameter if provided (bypasses dropdown selection)
  if (seasonId) {
    url += `?season_id=${encodeURIComponent(seasonId)}`;
  }

  logger.info(`Navigating to PGHL schedule page: ${url}`);

  try {
    // Use domcontentloaded instead of networkidle0 for faster initial load
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    logger.debug('Page navigation completed, waiting for Angular...');

    // Wait for Angular to render
    // Don't require select elements if we're using URL parameter (seasonId provided)
    await waitForAngular(page, !seasonId);

    logger.debug('PGHL schedule page loaded');
  } catch (error) {
    logger.error('Failed to navigate to PGHL schedule page:', error);

    // Try to get page content for debugging
    try {
      const content = await page.content();
      logger.error('Page content length:', content.length);
      logger.error('Page content sample:', content.substring(0, 1000));
    } catch (contentError) {
      logger.error('Could not retrieve page content:', contentError);
    }

    throw new WebsiteUnavailableError(url, error instanceof Error ? error : undefined);
  }
}

/**
 * Extract select options from a dropdown element
 * Works with both native <select> and custom dropdowns
 */
export async function extractSelectOptions(
  page: Page,
  selector: string,
  context: string
): Promise<SelectOption[]> {
  logger.debug(`Extracting options from: ${selector}`);

  try {
    // Wait for the selector to appear (increased timeout for Vercel)
    await page.waitForSelector(selector, { timeout: 20000 });

    // Give Angular extra time to populate the dropdown
    await delay(1000);

    // Extract options from select element
    const options = await page.$$eval(selector + ' option', (elements) => {
      return elements.map((el) => ({
        value: (el as HTMLOptionElement).value,
        label: el.textContent?.trim() || '',
        selected: (el as HTMLOptionElement).selected,
      }));
    });

    // Filter out empty/placeholder options
    const validOptions = options.filter(
      (opt) => opt.value && opt.value !== '' && opt.label && opt.label !== ''
    );

    logger.debug(`Found ${validOptions.length} options for ${context}`);
    return validOptions;
  } catch (error) {
    logger.error(`Failed to extract options for ${context}:`, error);
    throw new ScrapingError(selector, context);
  }
}

/**
 * Select an option from a dropdown and wait for page update
 */
export async function selectDropdownOption(
  page: Page,
  selector: string,
  value: string,
  context: string
): Promise<void> {
  logger.debug(`Selecting ${context}: ${value}`);

  try {
    await page.select(selector, value);

    // Wait for Angular to update (HockeyShift makes AJAX calls)
    await delay(2000);

    // Wait for network to be idle after selection
    await page.waitForNetworkIdle({ timeout: 10000 });

    logger.debug(`Selected ${context}: ${value}`);
  } catch (error) {
    logger.error(`Failed to select ${context}:`, error);
    throw new ScrapingError(selector, `selecting ${context} option`);
  }
}

/**
 * Get season options from PGHL schedule page
 * This is the first step in progressive discovery
 *
 * @param page - Puppeteer page instance
 * @param seasonId - Optional season ID to pre-select via URL (e.g., "number:9486")
 */
export async function getSeasonOptions(page: Page, seasonId?: string): Promise<SelectOption[]> {
  await navigateToSchedulePage(page, seasonId);

  // HockeyShift typically uses a season selector with id or class
  // Common selectors to try (in order of preference)
  const seasonSelectors = [
    'select[ng-model*="season"]',
    'select[name="season"]',
    'select#season',
    '.season-select select',
    'select[ng-model*="Season"]',
  ];

  for (const selector of seasonSelectors) {
    try {
      const options = await extractSelectOptions(page, selector, 'seasons');
      if (options.length > 0) {
        logger.info(`Found ${options.length} seasons using selector: ${selector}`);
        return options;
      }
    } catch (error) {
      // Try next selector
      continue;
    }
  }

  throw new ScrapingError(
    seasonSelectors.join(', '),
    'season dropdown (tried multiple selectors)'
  );
}

/**
 * Get division options for a selected season
 * Assumes page is already loaded - does NOT reload
 */
export async function getDivisionOptions(
  page: Page,
  seasonId: string
): Promise<SelectOption[]> {
  // Select the season first (on already-loaded page)
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

  // Now extract division options (after AJAX update)
  const divisionSelectors = [
    'select[ng-model*="division"]',
    'select[name="division"]',
    'select#division',
    '.division-select select',
    'select[ng-model*="Division"]',
  ];

  for (const selector of divisionSelectors) {
    try {
      const options = await extractSelectOptions(page, selector, 'divisions');
      if (options.length > 0) {
        logger.info(`Found ${options.length} divisions using selector: ${selector}`);
        return options;
      }
    } catch (error) {
      continue;
    }
  }

  // If no division dropdown found, return empty array
  // (Some leagues might not have division filtering)
  logger.warn('No division dropdown found, returning empty array');
  return [];
}

/**
 * Get team options for a selected season and division
 * Assumes page is already loaded and season is already selected
 */
export async function getTeamOptions(
  page: Page,
  seasonId: string,
  divisionId: string
): Promise<SelectOption[]> {
  // Select division (season should already be selected)
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

  // Extract team options (after AJAX update)
  const teamSelectors = [
    'select[ng-model*="team"]',
    'select[name="team"]',
    'select#team',
    '.team-select select',
    'select[ng-model*="Team"]',
  ];

  for (const selector of teamSelectors) {
    try {
      const options = await extractSelectOptions(page, selector, 'teams');
      if (options.length > 0) {
        logger.info(`Found ${options.length} teams using selector: ${selector}`);
        return options;
      }
    } catch (error) {
      continue;
    }
  }

  // If no team dropdown found, return empty array
  logger.warn('No team dropdown found, returning empty array');
  return [];
}
