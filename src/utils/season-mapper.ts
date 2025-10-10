/**
 * Season mapping utility for PGHL
 * Maps user-friendly season formats to internal season IDs
 */

import { logger } from './logger.js';

/**
 * Known season ID mappings from PGHL website
 * Values are just the numeric IDs (for URL parameters)
 * Updated: 2025-10-10
 */
const SEASON_ID_MAP: Record<string, string> = {
  // 2025-26 Season
  '2025-26 12u-19u AA': '9486',
  '2025-26 14-19u Tier 1': '9485',

  // 2024-25 Season
  '2024-25 Championships': '8540',
  '2024-25 12u-19u AA': '7722',
  '2024-25 14-19u Tier 1': '7721',

  // 2023-24 Season
  '2023-24 Championships': '6877',
  '2023-24 Season': '5979',

  // 2022-23 Season
  '2022-23 Championships': '5143',
  '2022-23 Season': '4679',
};

/**
 * Division tier mapping
 * Maps division names to their tier (AA or Tier 1/AAA)
 */
export function getDivisionTier(division: string): 'AA' | 'Tier1' | null {
  const normalized = division.toLowerCase().trim();

  if (normalized.includes('tier 1') || normalized.includes('tier1') || normalized.includes('aaa')) {
    return 'Tier1';
  }

  if (normalized.includes('aa') || normalized.includes('12u') || normalized.includes('10u')) {
    return 'AA';
  }

  return null;
}

/**
 * Normalize season format
 * Converts various season formats to canonical format
 *
 * Supported input formats:
 * - "2025/26", "2025-26", "2025/2026", "2025-2026"
 * - "2025-26 12u-19u AA" (full format)
 *
 * @param season - Season string in any supported format
 * @param division - Division name (optional, used for tier detection)
 * @returns Normalized season string matching SEASON_ID_MAP keys
 */
export function normalizeSeasonFormat(season: string, division?: string): string {
  let normalized = season.trim();

  // If already in full format, return as-is
  if (SEASON_ID_MAP[normalized]) {
    return normalized;
  }

  // Extract year range from various formats
  // "2025/26" -> "2025-26"
  // "2025/2026" -> "2025-26"
  // "2025-2026" -> "2025-26"
  const yearMatch = normalized.match(/(\d{4})[/-](\d{2,4})/);
  if (!yearMatch) {
    throw new Error(`Invalid season format: ${season}. Expected format like "2025-26" or "2025/26"`);
  }

  const startYear = yearMatch[1];
  const endYear = yearMatch[2].length === 2 ? yearMatch[2] : yearMatch[2].slice(-2);
  const yearRange = `${startYear}-${endYear}`;

  // Determine tier from division if provided
  let tier: 'AA' | 'Tier1' | null = null;
  if (division) {
    tier = getDivisionTier(division);
  }

  // Map to full season format based on tier
  if (tier === 'AA') {
    const fullFormat = `${yearRange} 12u-19u AA`;
    if (SEASON_ID_MAP[fullFormat]) {
      return fullFormat;
    }
  } else if (tier === 'Tier1') {
    const fullFormat = `${yearRange} 14-19u Tier 1`;
    if (SEASON_ID_MAP[fullFormat]) {
      return fullFormat;
    }
  }

  // If no division provided or tier detection failed, try both formats
  const aaFormat = `${yearRange} 12u-19u AA`;
  if (SEASON_ID_MAP[aaFormat]) {
    logger.debug(`Defaulting to AA tier for season: ${season}`);
    return aaFormat;
  }

  const tier1Format = `${yearRange} 14-19u Tier 1`;
  if (SEASON_ID_MAP[tier1Format]) {
    logger.debug(`Using Tier 1 for season: ${season}`);
    return tier1Format;
  }

  throw new Error(
    `Season "${season}" not found in known seasons. Available: ${Object.keys(SEASON_ID_MAP).join(', ')}`
  );
}

/**
 * Get season ID from season string
 *
 * @param season - Season string (e.g., "2025-26", "2025/26", "2025-26 12u-19u AA")
 * @param division - Division name (optional, used for tier detection)
 * @returns Season ID (e.g., "number:9486")
 */
export function getSeasonId(season: string, division?: string): string {
  const normalizedSeason = normalizeSeasonFormat(season, division);
  const seasonId = SEASON_ID_MAP[normalizedSeason];

  if (!seasonId) {
    throw new Error(`Season ID not found for: ${normalizedSeason}`);
  }

  logger.debug(`Mapped season "${season}" -> "${normalizedSeason}" -> ${seasonId}`);
  return seasonId;
}

/**
 * Get full season label from short format
 *
 * @param season - Season string (e.g., "2025-26")
 * @param division - Division name (used for tier detection)
 * @returns Full season label (e.g., "2025-26 12u-19u AA")
 */
export function getSeasonLabel(season: string, division?: string): string {
  return normalizeSeasonFormat(season, division);
}
