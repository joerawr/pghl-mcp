/**
 * Team entity - Represents a hockey team within a specific season and division
 */

export interface Team {
  name: string;           // Full team name (e.g., "Las Vegas Storm 12u AA")
  division: string;       // Division identifier (e.g., "12u AA")
  season: string;         // Season identifier (e.g., "2025-26")
}
