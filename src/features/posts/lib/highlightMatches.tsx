import { Fragment, type ReactNode } from 'react';

/**
 * Wraps every case-insensitive occurrence of `query` inside `text`
 * in a `<mark>` element. Returns the original string unchanged
 * when the query is empty or has no matches.
 *
 * Matching is case-insensitive, but the original casing of `text`
 * is preserved in the output (searching "foo" highlights "Foo").
 */
export function highlightMatches(text: string, query: string): ReactNode {
  const needle = query.trim();
  if (!needle) return text;

  const haystack = text.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  const parts: ReactNode[] = [];

  let cursor = 0;
  let matchIndex = haystack.indexOf(lowerNeedle, cursor);
  let key = 0;

  while (matchIndex !== -1) {
    if (matchIndex > cursor) {
      parts.push(<Fragment key={key++}>{text.slice(cursor, matchIndex)}</Fragment>);
    }
    const matchEnd = matchIndex + lowerNeedle.length;
    parts.push(<mark key={key++}>{text.slice(matchIndex, matchEnd)}</mark>);
    cursor = matchEnd;
    matchIndex = haystack.indexOf(lowerNeedle, cursor);
  }

  // Trailing text after the last match.
  if (cursor < text.length) {
    parts.push(<Fragment key={key++}>{text.slice(cursor)}</Fragment>);
  }

  return <>{parts}</>;
}