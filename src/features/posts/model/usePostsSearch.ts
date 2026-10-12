import { useMemo } from 'react';
import type { Post } from './types';

/**
 * Filters posts by a case-insensitive substring match
 * against `title` and `body`.
 *
 * The search is client-side and memoised so that 1000+ rows
 * are not re-filtered on every unrelated re-render.
 */
export function usePostsSearch(posts: Post[], query: string): Post[] {
  return useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return posts;

    return posts.filter((post) => {
      return (
        post.title.toLowerCase().includes(needle) ||
        post.body.toLowerCase().includes(needle)
      );
    });
  }, [posts, query]);
}