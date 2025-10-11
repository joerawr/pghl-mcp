/**
 * Output Formatting Utilities
 *
 * Format schedule data for MCP tool responses
 */

import { Game } from '../models/game.js';

const PACIFIC_TZ = 'America/Los_Angeles';

export interface FormatGamesOptions {
  title?: string;
  includeOpponent?: boolean;
  groupByDate?: boolean;
}

/**
 * Format a list of games as a readable string
 */
export function formatGamesList(games: Game[], options: FormatGamesOptions = {}): string {
  const { title, includeOpponent = true, groupByDate = false } = options;

  const lines: string[] = [];

  if (title) {
    lines.push(title);
    lines.push('='.repeat(title.length));
    lines.push('');
  }

  if (groupByDate) {
    // Group games by date
    const gamesByDate = new Map<string, Game[]>();

    for (const game of games) {
      if (!gamesByDate.has(game.date)) {
        gamesByDate.set(game.date, []);
      }
      gamesByDate.get(game.date)!.push(game);
    }

    for (const [dateKey, dateGames] of gamesByDate) {
      // Format date as "Monday, October 11, 2025"
      const dateObj = new Date(dateKey);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      lines.push(`## ${formattedDate}`);
      lines.push('');

      for (const game of dateGames) {
        lines.push(formatGame(game, { includeOpponent, includeDate: false }));
      }

      lines.push('');
    }
  } else {
    // Simple list
    for (const game of games) {
      lines.push(formatGame(game, { includeOpponent }));
    }
  }

  return lines.join('\n');
}

interface FormatGameOptions {
  includeOpponent?: boolean;
  includeDate?: boolean;
}

/**
 * Format a single game
 */
function formatGame(game: Game, options: FormatGameOptions = {}): string {
  const { includeOpponent = true, includeDate = true } = options;

  const parts: string[] = [];

  // Date and time
  if (includeDate) {
    // Format date as "Sat Oct 11"
    const dateObj = new Date(game.date);
    const dateStr = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    parts.push(`${dateStr} at ${game.time}`);
  } else {
    parts.push(`${game.time}`);
  }

  // Teams (away @ home)
  if (includeOpponent) {
    parts.push(`${game.away} @ ${game.home}`);
  }

  // Venue
  if (game.venue) {
    const venueParts = [game.venue];
    if (game.rink) {
      venueParts.push(game.rink);
    }
    parts.push(`- ${venueParts.join(' / ')}`);
  }

  // Status (if available)
  if (game.status) {
    parts.push(`[${game.status}]`);
  }

  return parts.join(' ');
}
