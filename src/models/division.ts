/**
 * Division entity - Represents an age group and skill level combination within a season
 */

export interface Division {
  id: string;             // Composite identifier (e.g., "12u AA")
  ageGroup: string;       // Age group (e.g., "12u", "14u", "16u", "19u")
  skillLevel: string;     // Skill level (e.g., "A", "AA", "AAA")
  season: string;         // Season this division belongs to
}
