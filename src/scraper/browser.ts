/**
 * Puppeteer browser configuration for PGHL-MCP
 * Supports both local development and Vercel serverless deployment
 */

import puppeteer, { Browser } from 'puppeteer-core';
import { logger } from '../utils/logger.js';

/**
 * Get Puppeteer launch configuration based on environment
 * Local: Uses system Chrome via CHROME_EXECUTABLE_PATH
 * Vercel: Uses @sparticuz/chromium
 */
export async function getBrowserConfig() {
  const isVercel = !!process.env.VERCEL;

  if (isVercel) {
    // Vercel serverless configuration - use @sparticuz/chromium
    logger.debug('Configuring browser for Vercel environment');

    // Dynamically import chromium for Vercel
    const chromium = await import('@sparticuz/chromium');

    return {
      args: chromium.default.args,
      executablePath: await chromium.default.executablePath(),
      headless: true,
    };
  } else {
    // Local development configuration
    logger.debug('Configuring browser for local development');
    const chromePath = process.env.CHROME_EXECUTABLE_PATH ||
                       '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

    return {
      executablePath: chromePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    };
  }
}

/**
 * Launch browser instance with appropriate configuration
 */
export async function launchBrowser(): Promise<Browser> {
  const config = await getBrowserConfig();

  logger.info('Launching browser...');
  logger.debug('Browser config:', JSON.stringify(config, null, 2));

  try {
    const browser = await puppeteer.launch(config);
    logger.info('Browser launched successfully');
    return browser;
  } catch (error) {
    logger.error('Failed to launch browser:', error);
    throw new Error(
      `Failed to launch browser. ${
        !process.env.VERCEL
          ? 'Please ensure Chrome is installed and CHROME_EXECUTABLE_PATH is set correctly.'
          : 'Vercel serverless browser configuration failed.'
      }\n\nOriginal error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Create a new browser page with standard configuration
 */
export async function createPage(browser: Browser) {
  const page = await browser.newPage();

  // Set viewport
  await page.setViewport({
    width: 1280,
    height: 720,
  });

  // Set user agent
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  // Set default timeout (reduced for Vercel serverless limits)
  page.setDefaultTimeout(25000); // 25 seconds

  logger.debug('Created new page with standard configuration');

  return page;
}

/**
 * Safely close browser instance
 */
export async function closeBrowser(browser: Browser): Promise<void> {
  try {
    await browser.close();
    logger.info('Browser closed successfully');
  } catch (error) {
    logger.warn('Error closing browser:', error);
  }
}
