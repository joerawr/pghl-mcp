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
  team: z.string().describe('Full team name (e.g., "Las Vegas Storm 12u AA")'),
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
