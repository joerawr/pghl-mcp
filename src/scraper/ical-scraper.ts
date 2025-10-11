/**
 * PGHL iCal Schedule Scraper
 *
 * Fetches schedule data from PGHL's public iCal feeds.
 * This bypasses all the Puppeteer/bot detection issues by using
 * the calendar subscription endpoints that are meant to be public.
 */

import ical from 'node-ical';
import { logger } from '../utils/logger.js';
import { Game } from '../models/game.js';

/**
 * PGHL API constants
 * The client_service_id is extracted from the "Subscribe to Schedule" button on the website
 */
const CLIENT_SERVICE_ID = '05e3fa78-061c-4607-a558-a54649c5044f';
const LEAGUE_ID = '1447'; // PGHL league ID
const BASE_ICAL_URL = 'https://web.api.digitalshift.ca/partials/stats/schedule/ical';

export interface ICalScraperOptions {
  seasonId?: string;
  divisionId?: string;
  teamId?: string;
}

/**
 * Fetch and parse schedule from PGHL iCal feed
 */
export async function fetchScheduleFromICal(options: ICalScraperOptions): Promise<Game[]> {
  const { seasonId, divisionId, teamId } = options;

  // Build URL parameters
  const params = new URLSearchParams({
    league_id: LEAGUE_ID,
    client_service_id: CLIENT_SERVICE_ID,
  });

  if (seasonId) params.append('season_id', seasonId);
  if (divisionId) params.append('division_id', divisionId);
  if (teamId) params.append('team_id', teamId);

  const url = `${BASE_ICAL_URL}?${params.toString()}`;

  logger.info(`Fetching iCal schedule from: ${url}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const icalData = await response.text();
    logger.debug(`Downloaded ${icalData.length} bytes of iCal data`);

    // Parse iCal data
    const events = await ical.async.parseICS(icalData);

    // Convert iCal events to Game objects
    const games: Game[] = [];

    for (const [uid, event] of Object.entries(events)) {
      if (event.type !== 'VEVENT') continue;

      try {
        const game = parseICalEvent(event);
        games.push(game);
      } catch (error) {
        logger.warn(`Failed to parse iCal event ${uid}:`, error);
        continue;
      }
    }

    // Sort by date (string format YYYY-MM-DD)
    games.sort((a, b) => a.date.localeCompare(b.date));

    logger.info(`Parsed ${games.length} games from iCal feed`);

    return games;

  } catch (error) {
    logger.error('Failed to fetch iCal schedule:', error);
    throw error;
  }
}

/**
 * Parse a single iCal VEVENT into a Game object
 */
function parseICalEvent(event: any): Game {
  // Parse the SUMMARY field which contains team names
  // Format: "Away Team @ Home Team" or "Away Team vs Home Team"
  const summary = event.summary || '';
  const location = event.location || '';

  let awayTeam = '';
  let homeTeam = '';
  let gameType: 'home' | 'away' | 'neutral' = 'neutral';

  if (summary.includes(' @ ')) {
    [awayTeam, homeTeam] = summary.split(' @ ').map((s: string) => s.trim());
    gameType = 'away'; // This is typically from perspective of away team
  } else if (summary.includes(' vs ')) {
    [awayTeam, homeTeam] = summary.split(' vs ').map((s: string) => s.trim());
    gameType = 'home'; // vs typically means home game
  } else {
    // Fallback: use entire summary as opponent
    awayTeam = summary.trim();
    homeTeam = summary.trim();
  }

  // Parse location into facility and rink
  // Format: "Facility Name / Rink Name" or just "Facility Name"
  let facility = location;
  let rink = '';

  if (location.includes(' / ')) {
    [facility, rink] = location.split(' / ').map((s: string) => s.trim());
  }

  // Extract division from team names if available
  // Format: "Team Name 12u AA"
  const divisionMatch = (awayTeam || homeTeam).match(/(\d+u\s+A{1,3})/);
  const division = divisionMatch ? divisionMatch[1] : '';

  // Create Game object matching the Game model
  const game: Game = {
    date: formatDate(event.start),
    time: formatTime(event.start),
    home: homeTeam,
    away: awayTeam,
    venue: facility,
    division: division,
    rink: rink || undefined,
    gameType: gameType || undefined,
  };

  return game;
}

/**
 * Format date to YYYY-MM-DD string
 */
function formatDate(date: any): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles', // Pacific time
  }).format(d);
}

/**
 * Format date to time string (e.g., "7:00 PM")
 */
function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Los_Angeles', // Pacific time
  }).format(new Date(date));
}
