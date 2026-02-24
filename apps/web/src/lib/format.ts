/**
 * Shared formatting utilities used across registry components.
 *
 * Extracted to eliminate duplication — these helpers were previously
 * defined inline in artifact-results, recent-activity-feed, and trust-graph.
 */

/**
 * Converts an ISO 8601 timestamp to a human-readable relative string.
 *
 * @param iso - An ISO 8601 date string (e.g. `"2024-12-01T12:00:00Z"`).
 * @returns A relative time string like `"3h ago"` or a formatted date for older entries.
 *
 * @example
 * formatRelativeTime('2024-12-01T12:00:00Z') // "2d ago"
 */
export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Truncates a string in the middle, preserving the start and end.
 *
 * @param value - The string to truncate.
 * @param max   - Maximum length before truncation kicks in.
 * @returns The original string if short enough, or `"start…end"`.
 *
 * @example
 * truncateMiddle('did:keri:E8jsh1234567890abcdef', 16) // "did:ker…abcdef"
 */
export function truncateMiddle(value: string, max: number): string {
  if (value.length <= max) return value;
  const side = Math.floor((max - 1) / 2);
  return `${value.slice(0, side)}…${value.slice(-side)}`;
}
