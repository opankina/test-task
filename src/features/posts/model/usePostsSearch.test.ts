import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Post } from './types';
import { usePostsSearch } from './usePostsSearch';

const makePost = (overrides: Partial<Post> = {}): Post => ({
  userId: 1,
  id: 1,
  title: 'default title',
  body: 'default body',
  ...overrides,
});

const posts: Post[] = [
  makePost({ id: 10, userId: 2, title: 'Alpha', body: 'First body' }),
  makePost({ id: 20, userId: 3, title: 'Beta', body: 'Second body' }),
  makePost({ id: 30, userId: 4, title: 'Gamma', body: 'Contains alpha inside' }),
];

describe('usePostsSearch', () => {
  it('returns all posts when the query is empty', () => {
    const { result } = renderHook(() => usePostsSearch(posts, ''));
    expect(result.current).toEqual(posts);
  });

  it('returns all posts when the query is only whitespace', () => {
    const { result } = renderHook(() => usePostsSearch(posts, '   '));
    expect(result.current).toEqual(posts);
  });

  it('matches against the title, case-insensitively', () => {
    const { result } = renderHook(() => usePostsSearch(posts, 'alpha'));
    expect(result.current.map((post) => post.id)).toEqual([10, 30]);
    // - post 10 matches by title
    // - post 30 matches by body
  });

  it('matches against the body when the title does not match', () => {
    const { result } = renderHook(() => usePostsSearch(posts, 'second'));
    expect(result.current.map((post) => post.id)).toEqual([20]);
  });

  it('returns an empty array when nothing matches', () => {
    const { result } = renderHook(() => usePostsSearch(posts, 'zzzz'));
    expect(result.current).toEqual([]);
  });

  it('trims the query before matching', () => {
    const { result } = renderHook(() => usePostsSearch(posts, '  beta  '));
    expect(result.current.map((post) => post.id)).toEqual([20]);
  });

  it('does not search by id or userId', () => {
    // "10" appears as id of the first post and would match a naive
    // implementation. We only search title and body on purpose.
    const { result } = renderHook(() => usePostsSearch(posts, '10'));
    expect(result.current).toEqual([]);
  });
});