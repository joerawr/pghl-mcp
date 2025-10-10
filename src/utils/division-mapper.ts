/**
 * Division mapping utility for PGHL
 * Maps division names to their internal IDs
 */

import { logger } from './logger.js';

/**
 * Known division ID mappings for PGHL
 * Values are just the numeric IDs (for URL parameters)
 * These are stable - divisions only change when PGHL adds/removes age groups (rare)
 * Updated: 2025-10-10
 */

// AA Divisions (season_id: 9486)
const AA_DIVISIONS: Record<string, string> = {
  '12u AA': '42897',
  '12u AAA': '42898',  // Note: This is labeled AAA but in AA season
  '14u AA': '42899',
  '16/19u AA': '42900',
};

// Tier 1 / AAA Divisions (season_id: 9485)
const TIER1_DIVISIONS: Record<string, string> = {
  '14u AAA': '42895',
  '16/19u AAA': '42896',
};

/**
 * Get division ID from division name
 *
 * @param division - Division name (e.g., "12u AA", "14u AAA")
 * @param seasonId - Season ID to determine which division set to use
 * @returns Division ID (e.g., "42897")
 */
export function getDivisionId(division: string, seasonId: string): string {
  const normalizedDivision = division.trim();

  // Determine which division set based on season ID
  const divisionMap = seasonId === '9485' ? TIER1_DIVISIONS : AA_DIVISIONS;

  const divisionId = divisionMap[normalizedDivision];

  if (!divisionId) {
    const availableDivisions = Object.keys(divisionMap);
    throw new Error(
      `Division "${division}" not found. Available divisions: ${availableDivisions.join(', ')}`
    );
  }

  logger.debug(`Mapped division "${division}" -> ${divisionId}`);
  return divisionId;
}

/**
 * Get all available divisions for a season
 *
 * @param seasonId - Season ID
 * @returns Array of division names
 */
export function getAvailableDivisions(seasonId: string): string[] {
  const divisionMap = seasonId === '9485' ? TIER1_DIVISIONS : AA_DIVISIONS;
  return Object.keys(divisionMap);
}
