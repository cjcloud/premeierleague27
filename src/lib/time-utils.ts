/**
 * Utility functions for time-based operations
 */

// The deadline for predictions - kickoff of the first match of the 2026/27 season.
// Opening fixture: Arsenal v Coventry City, Friday 21 August 2026, 20:00 BST.
// CONFIRM against the final published fixtures before go-live; this is the single
// value that locks predictions.
const PREDICTIONS_DEADLINE = new Date('2026-08-21T20:00:00+01:00');

/**
 * Check if the prediction deadline has passed
 * @returns boolean - true if the deadline has passed, false if still active
 */
export function isPredictionDeadlinePassed(): boolean {
  const now = new Date();
  return now > PREDICTIONS_DEADLINE;
}

/**
 * Get a formatted string representation of the predictions deadline
 * @returns string - formatted deadline
 */
export function getFormattedDeadline(): string {
  return PREDICTIONS_DEADLINE.toLocaleString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZone: 'Europe/London',
    timeZoneName: 'short'
  });
}
