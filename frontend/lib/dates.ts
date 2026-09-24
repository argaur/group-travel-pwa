/** Returns a user-facing message when the end date falls before the start date, else null. */
export function tripDatesError(start: string, end: string): string | null {
  if (start && end && end < start) return "End date can't be before the start date."
  return null
}
