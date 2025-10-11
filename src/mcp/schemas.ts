/**
 * Zod validation schemas for MCP tool inputs
 * Based on contracts/mcp-tools.json specification
 */

import { z } from 'zod';

/**
 * Schema for get_schedule tool arguments
 */
export const GetScheduleArgsSchema = z.object({
  season: z.string().describe('Season identifier in YYYY-YY format (e.g., "2025-26")'),
  division: z.string().describe('Division identifier (e.g., "12u AA", "14u AAA")'),
  scope: z.enum(['current', 'full']).optional().default('current').describe('Scope of schedule: "current" for upcoming games only, "full" for all games past and future. Default: "current"'),
  team: z.string().optional().describe('Optional: Filter to specific team name. If omitted, returns all games in the division.'),
  date: z.string().optional().describe('Optional date filter in YYYY-MM-DD format'),
});

export type GetScheduleArgs = z.infer<typeof GetScheduleArgsSchema>;

/**
 * Schema for list_schedule_options tool arguments
 */
export const ListScheduleOptionsArgsSchema = z.object({
  season: z.string().optional().describe('Optional season filter to get divisions'),
  division: z.string().optional().describe('Optional division filter to get teams (requires season)'),
});

export type ListScheduleOptionsArgs = z.infer<typeof ListScheduleOptionsArgsSchema>;

/**
 * Schema for get_next_game tool arguments
 */
export const GetNextGameArgsSchema = z.object({
  season: z.string().describe('Season identifier in YYYY-YY format'),
  division: z.string().describe('Division identifier'),
  team: z.string().describe('Full team name'),
});

export type GetNextGameArgs = z.infer<typeof GetNextGameArgsSchema>;

/**
 * Schema for get_team_schedule tool arguments
 */
export const GetTeamScheduleArgsSchema = z.object({
  team_id: z.string().describe('The team ID (e.g., "586889" for Las Vegas Storm 12u AA)'),
  season_id: z.string().optional().describe('Optional season ID (e.g., "9486" for 2025-26 season)'),
});

export type GetTeamScheduleArgs = z.infer<typeof GetTeamScheduleArgsSchema>;

/**
 * Schema for get_division_schedule tool arguments
 */
export const GetDivisionScheduleArgsSchema = z.object({
  season_id: z.string().describe('The season ID (e.g., "9486" for 2025-26 season)'),
  division_id: z.string().optional().describe('Optional division ID to filter results'),
  group_by_date: z.boolean().optional().describe('Group games by date for easier reading'),
});

export type GetDivisionScheduleArgs = z.infer<typeof GetDivisionScheduleArgsSchema>;
