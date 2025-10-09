/**
 * SelectOption - Represents an HTML select option (used for dropdowns on PGHL website)
 */

export interface SelectOption {
  value: string;          // Option value attribute (used for form submission)
  label: string;          // Display text (user-facing)
  selected: boolean;      // Whether this option is currently selected
}
