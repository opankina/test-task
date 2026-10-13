import { describe, expect, it } from 'vitest';
import { findMatches } from './findMatches';

describe('findMatches', () => {
  it('returns an empty array for empty text', () => {
    expect(findMatches('', 'foo')).toEqual([]);
  });

  it('returns the whole text as a single non-match segment when the query is empty', () => {
    expect(findMatches('hello world', '')).toEqual([
      { text: 'hello world', isMatch: false },
    ]);
  });

  it('returns the whole text as a single non-match segment when the query is whitespace', () => {
    expect(findMatches('hello world', '   ')).toEqual([
      { text: 'hello world', isMatch: false },
    ]);
  });

  it('returns the whole text as a single non-match segment when nothing matches', () => {
    expect(findMatches('hello world', 'xyz')).toEqual([
      { text: 'hello world', isMatch: false },
    ]);
  });

  it('trims the query before matching', () => {
    expect(findMatches('hello world', '  world  ')).toEqual([
      { text: 'hello ', isMatch: false },
      { text: 'world', isMatch: true },
    ]);
  });

  it('matches case-insensitively but preserves the original casing', () => {
    expect(findMatches('Hello World', 'world')).toEqual([
      { text: 'Hello ', isMatch: false },
      { text: 'World', isMatch: true },
    ]);
  });

  it('handles a match at the very start', () => {
    expect(findMatches('hello world', 'hello')).toEqual([
      { text: 'hello', isMatch: true },
      { text: ' world', isMatch: false },
    ]);
  });

  it('handles a match at the very end', () => {
    expect(findMatches('hello world', 'world')).toEqual([
      { text: 'hello ', isMatch: false },
      { text: 'world', isMatch: true },
    ]);
  });

  it('finds every occurrence, not just the first', () => {
    expect(findMatches('foo bar foo baz foo', 'foo')).toEqual([
      { text: 'foo', isMatch: true },
      { text: ' bar ', isMatch: false },
      { text: 'foo', isMatch: true },
      { text: ' baz ', isMatch: false },
      { text: 'foo', isMatch: true },
    ]);
  });

  it('consumes overlapping occurrences left-to-right', () => {
    expect(findMatches('aaa', 'aa')).toEqual([
      { text: 'aa', isMatch: true },
      { text: 'a', isMatch: false },
    ]);
  });

  it('matches when the query equals the entire text', () => {
    expect(findMatches('exact', 'exact')).toEqual([
      { text: 'exact', isMatch: true },
    ]);
  });
});