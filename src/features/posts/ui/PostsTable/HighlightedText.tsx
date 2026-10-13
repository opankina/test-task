import { Fragment } from 'react';
import { findMatches } from '../../lib/findMatches';

interface HighlightedTextProps {
  text: string;
  query: string;
}

/**
 * Renders `text` with every occurrence of `query` wrapped in `<mark>`.
 * The presentation layer for {@link findMatches}.
 */
export function HighlightedText({ text, query }: HighlightedTextProps) {
  const segments = findMatches(text, query);

  return (
    <>
      {segments.map((segment, index) =>
        segment.isMatch ? (
          <mark key={index}>{segment.text}</mark>
        ) : (
          <Fragment key={index}>{segment.text}</Fragment>
        ),
      )}
    </>
  );
}