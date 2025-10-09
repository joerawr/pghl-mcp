/**
 * ScheduleOptions - Container for hierarchical option discovery
 */

import { SelectOption } from './select-option.js';

export interface ScheduleOptions {
  seasons: SelectOption[];      // Available seasons
  divisions: SelectOption[];    // Available divisions (populated if season selected)
  teams: SelectOption[];        // Available teams (populated if season + division selected)
}
