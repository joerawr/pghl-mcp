/**
 * Date and time parsing utilities for PGHL schedule data
 * Based on data-model.md specification
 */

import { parse, format } from 'date-fns';
import { TZDate } from '@date-fns/tz';

/**
 * Parse PGHL date string to YYYY-MM-DD format
 * Handles multiple date formats from PGHL website
 *
 * @param dateStr - Date string from website (e.g., "Sat Sep 13", "09/13/2025", "2025-09-13")
 * @param season - Season identifier to infer year (e.g., "2025-26")
 * @returns ISO date string in YYYY-MM-DD format
 */
export function parsePGHLDate(dateStr: string, season: string): string {
  // Extract year from season (e.g., "2025-26" → 2025)
  const year = parseInt(season.split('-')[0], 10);

  // Try format 1: "Sat Sep 13" (most common for game schedules)
  try {
    const parsed = parse(dateStr, 'EEE MMM dd', new Date(year, 0, 1));
    const pacificDate = new TZDate(parsed, 'America/Los_Angeles');
    return format(pacificDate, 'yyyy-MM-dd');
  } catch {}

  // Try format 2: "MM/DD/YYYY"
  try {
    const parsed = parse(dateStr, 'MM/dd/yyyy', new Date());
    return format(parsed, 'yyyy-MM-dd');
  } catch {}

  // Try format 3: "M/D/YYYY" (single digit month/day)
  try {
    const parsed = parse(dateStr, 'M/d/yyyy', new Date());
    return format(parsed, 'yyyy-MM-dd');
  } catch {}

  // Try format 4: Already ISO "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  throw new Error(`Unable to parse date: "${dateStr}". Expected formats: "EEE MMM dd", "MM/dd/yyyy", or "YYYY-MM-DD"`);
}

/**
 * Parse PGHL time string to HH:MM 24-hour format
 * Handles AM/PM times and converts to 24-hour format
 *
 * @param timeStr - Time string from website (e.g., "7:15AM PDT", "19:15", "14:30:00")
 * @returns Time in HH:MM 24-hour format
 */
export function parsePGHLTime(timeStr: string): string {
  // Remove timezone suffixes (PDT, PST, etc.) and extra seconds
  let cleaned = timeStr.trim().replace(/ [A-Z]{2,3}$/i, '').replace(/:\d{2}$/, '');

  // Handle AM/PM format
  const ampmMatch = timeStr.match(/(AM|PM)/i);
  if (ampmMatch) {
    // Remove AM/PM from cleaned string
    cleaned = cleaned.replace(/(AM|PM)/i, '').trim();

    const parts = cleaned.split(':');
    let hour = parseInt(parts[0], 10);
    const min = parts[1] || '00';

    if (ampmMatch[1].toUpperCase() === 'PM' && hour !== 12) {
      hour += 12;
    } else if (ampmMatch[1].toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }

    return `${hour.toString().padStart(2, '0')}:${min.padStart(2, '0')}`;
  }

  // Already 24-hour format (with or without leading zero)
  if (/^\d{1,2}:\d{2}$/.test(cleaned)) {
    const [hour, min] = cleaned.split(':');
    return `${hour.padStart(2, '0')}:${min}`;
  }

  throw new Error(`Unable to parse time: "${timeStr}". Expected formats: "H:MM AM/PM" or "HH:MM"`);
}

/**
 * Normalize team name for fuzzy matching
 * Removes punctuation, normalizes spaces, converts to lowercase
 *
 * @param name - Team name to normalize
 * @returns Normalized team name for comparison
 */
export function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')  // Remove punctuation
    .replace(/\s+/g, ' ')     // Normalize spaces
    .trim();
}

/**
 * Check if two team names match (case-insensitive, punctuation-tolerant)
 *
 * @param input - User input team name
 * @param canonical - Canonical team name from website
 * @returns True if names match
 */
export function teamNamesMatch(input: string, canonical: string): boolean {
  const normalizedInput = normalizeTeamName(input);
  const normalizedCanonical = normalizeTeamName(canonical);

  // Exact match after normalization
  if (normalizedInput === normalizedCanonical) {
    return true;
  }

  // Partial match: input is contained in canonical
  // e.g., "jr ducks" matches "Jr. Ducks 12u AA"
  if (normalizedCanonical.includes(normalizedInput)) {
    return true;
  }

  return false;
}

/**
 * Parse season ID to extract start and end years
 *
 * @param seasonId - Season identifier (e.g., "2025-26", "2025/26")
 * @returns Object with startYear and endYear, or null if unparseable
 */
export function parseSeason(seasonId: string): { startYear: number; endYear: number } | null {
  // Handle "2025-26" format (PGHL standard)
  const dashMatch = seasonId.match(/^(\d{4})-(\d{2})$/);
  if (dashMatch) {
    const startYear = parseInt(dashMatch[1], 10);
    const endYearShort = dashMatch[2];
    const endYear = parseInt(dashMatch[1].substring(0, 2) + endYearShort, 10);
    return { startYear, endYear };
  }

  // Handle "2025/26" format (alternative)
  const slashMatch = seasonId.match(/^(\d{4})\/(\d{2})$/);
  if (slashMatch) {
    const startYear = parseInt(slashMatch[1], 10);
    const endYearShort = slashMatch[2];
    const endYear = parseInt(slashMatch[1].substring(0, 2) + endYearShort, 10);
    return { startYear, endYear };
  }

  return null;  // Unparseable
}
