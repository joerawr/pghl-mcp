/**
 * Game entity - Represents a single scheduled hockey game
 * Based on data-model.md specification
 */

export interface Game {
  // Required fields (MVP core per clarification Q2)
  date: string;           // Game date in YYYY-MM-DD format (ISO 8601)
  time: string;           // Game time in HH:MM format (24-hour, Pacific timezone)
  home: string;           // Home team full name
  away: string;           // Away team full name
  venue: string;          // Facility/arena name where game is played
  division: string;       // Age group + skill level (e.g., "12u AA")

  // Optional fields (extracted if present, not guaranteed)
  status?: string;        // Game status (e.g., "Final", "Scheduled", "Postponed")
                          // Passthrough from website, no validation (clarification Q2)
  rink?: string;          // Specific rink within venue (e.g., "Main", "North Rink")
                          // Often changes without schedule update, unreliable (clarification Q2)
  gameType?: string;      // Game type if present (e.g., "RS" for Regular Season, "PO" for Playoff)
}
