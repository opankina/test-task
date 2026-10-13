export interface MatchSegment {
  text: string;
  isMatch: boolean;
}

/**
 * Splits `text` into segments around every case-insensitive occurrence
 * of `query`.
 *
 * - Returns a single non-match segment when `query` is empty or trimmed to empty.
 * - Returns the whole `text` as one non-match segment when nothing matches.
 * - Preserves the original casing of `text` in the output.
 * - Consumes matches left-to-right; overlapping occurrences are not re-scanned.
 *
 * Pure function — no React, no DOM. Easy to reason about and to test.
 */
export function findMatches(text: string, query: string): MatchSegment[] {
  const needle = query.trim();
  if (!needle) {
    return text.length === 0 ? [] : [{ text, isMatch: false }];
  }

  const haystack = text.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  const segments: MatchSegment[] = [];

  let cursor = 0;
  let matchIndex = haystack.indexOf(lowerNeedle, cursor);

  while (matchIndex !== -1) {
    if (matchIndex > cursor) {
      segments.push({ text: text.slice(cursor, matchIndex), isMatch: false });
    }
    const matchEnd = matchIndex + lowerNeedle.length;
    segments.push({ text: text.slice(matchIndex, matchEnd), isMatch: true });
    cursor = matchEnd;
    matchIndex = haystack.indexOf(lowerNeedle, cursor);
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), isMatch: false });
  }

  return segments;
}