/**
 * Custom error types for PGHL-MCP
 */

/**
 * Base error class for all PGHL-MCP errors
 */
export class PGHLError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PGHLError';
  }
}

/**
 * Error thrown when team is not found in the specified division/season
 */
export class TeamNotFoundError extends PGHLError {
  constructor(
    public readonly teamName: string,
    public readonly division: string,
    public readonly season: string,
    public readonly availableTeams?: string[]
  ) {
    const suggestion = availableTeams && availableTeams.length > 0
      ? `\n\nAvailable teams:\n${availableTeams.map(t => `- ${t}`).join('\n')}`
      : '';

    super(
      `Team '${teamName}' not found in division '${division}' for season '${season}'.${suggestion}`
    );
    this.name = 'TeamNotFoundError';
  }
}

/**
 * Error thrown when PGHL website is unavailable or times out
 */
export class WebsiteUnavailableError extends PGHLError {
  constructor(
    public readonly url: string,
    public readonly originalError?: Error
  ) {
    super(
      `Unable to connect to PGHL website (${url}). Please check your internet connection and try again.${
        originalError ? `\n\nTechnical details: ${originalError.message}` : ''
      }`
    );
    this.name = 'WebsiteUnavailableError';
  }
}

/**
 * Error thrown when website structure has changed (selectors not found)
 */
export class ScrapingError extends PGHLError {
  constructor(
    public readonly selector: string,
    public readonly context: string
  ) {
    super(
      `Failed to scrape ${context}. Selector '${selector}' not found. The PGHL website structure may have changed.`
    );
    this.name = 'ScrapingError';
  }
}

/**
 * Error thrown when data validation fails
 */
export class ValidationError extends PGHLError {
  constructor(
    public readonly field: string,
    public readonly value: string,
    public readonly expectedFormat: string
  ) {
    super(
      `Invalid ${field}: "${value}". Expected format: ${expectedFormat}`
    );
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when no schedule data is available
 */
export class NoScheduleDataError extends PGHLError {
  constructor(
    public readonly teamName: string,
    public readonly season: string
  ) {
    super(
      `No schedule data available for ${teamName} in season ${season}. The schedule may not be published yet.`
    );
    this.name = 'NoScheduleDataError';
  }
}
