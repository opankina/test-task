import { highlightMatches } from '../../lib/highlightMatches';

interface HighlightedTextProps {
  text: string;
  query: string;
}

export function HighlightedText({ text, query }: HighlightedTextProps) {
  return <>{highlightMatches(text, query)}</>;
}