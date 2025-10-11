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
      args: [
        ...chromium.default.args,
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-features=IsolateOrigins,site-per-process',
        '--use-gl=swiftshader',
      ],
      executablePath: await chromium.default.executablePath(),
      headless: 'new' as any, // Use new headless mode
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

  // Modern Chrome user agent (Windows to avoid bot detection)
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
  );

  // Hide webdriver detection
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  // Set additional headers to appear more like a real browser
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  });

  // Set default timeout (reduced for Vercel serverless limits)
  page.setDefaultTimeout(25000); // 25 seconds

  // ==========================================
  // DIAGNOSTIC LOGGING (Vercel production only)
  // ==========================================
  const isVercel = !!process.env.VERCEL;

  if (isVercel) {
    // Log network failures + 4xx/5xx bodies
    page.on('requestfailed', (req) => {
      logger.error('[reqfailed]', req.url(), req.failure()?.errorText);
    });

    page.on('response', async (res) => {
      const url = res.url();
      const status = res.status();
      const type = res.request().resourceType(); // 'xhr','fetch','script', etc.

      if (status >= 400 || type === 'xhr' || type === 'fetch') {
        let body = '';
        try {
          body = await res.text();
        } catch {}
        logger.info(`[resp] ${status} ${type} ${url} ${body.slice(0, 400)}`);
      }
    });

    // Log JavaScript errors + console
    page.on('pageerror', (e) => logger.error('[pageerror]', e));
    page.on('console', (m) => logger.info(`[console] ${m.type()} ${m.text()}`));
  }

  logger.debug('Created new page with standard configuration');

  return page;
}

/**
 * Safely close browser instance
 */
export async function closeBrowser(browser: Browser): Promise<void> {
  try {
    // Close all pages first for faster cleanup
    const pages = await browser.pages();
    await Promise.all(pages.map(page => page.close().catch(() => {})));

    // Then close browser with timeout to prevent hanging
    await Promise.race([
      browser.close(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Browser close timeout')), 3000))
    ]);

    logger.info('Browser closed successfully');
  } catch (error) {
    logger.warn('Error closing browser, force killing:', error);
    // Force process to clean up if close failed
    try {
      const process = browser.process();
      if (process && !process.killed) {
        process.kill('SIGKILL');
        logger.debug('Browser process killed with SIGKILL');
      }
    } catch (killError) {
      logger.debug('Could not kill browser process:', killError);
    }
  }
}
