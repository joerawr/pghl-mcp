/**
 * Season entity - Represents a hockey season (typically spans two calendar years)
 */

export interface Season {
  id: string;             // Season identifier (e.g., "2025-26")
  label: string;          // Display name (may match id or be more descriptive)
  startYear?: number;     // Start year (optional, derived from id)
  endYear?: number;       // End year (optional, derived from id)
}
