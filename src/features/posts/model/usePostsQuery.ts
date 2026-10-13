import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPosts, FetchCancelledError } from '../api/fetchPosts';
import type { Post, PostsLoadState } from './types';

export interface UsePostsQueryResult {
  state: PostsLoadState;
  /** Retry after a first-load `error` / `cancelled`. */
  retry: () => void;
  /** Abort the in-flight request (works for both initial load and refresh). */
  cancel: () => void;
  /**
   * Reload the posts without unmounting the table.
   * No-op when no posts are on screen (i.e. before the first success).
   */
  refresh: () => void;
}

/** Internal fetch mode — drives which state to set on start and on failure. */
type FetchMode = 'initial' | 'refresh';

export function usePostsQuery(): UsePostsQueryResult {
  const [state, setState] = useState<PostsLoadState>({ status: 'idle' });
  const abortRef = useRef<AbortController | null>(null);
  /**
   * Mirror of the posts currently on screen. Kept in a ref so `refresh()`
   * can read them synchronously — without adding them to `state`, and
   * without performing side effects inside a `setState` updater (which
   * React may invoke twice in StrictMode).
   */
  const postsRef = useRef<Post[] | null>(null);

  const runFetch = useCallback(async (mode: FetchMode) => {
    // Abort any previous in-flight request before starting a new one.
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    // In refresh mode we keep the currently displayed posts so the table
    // stays mounted. In initial mode there is nothing to preserve.
    const existingPosts = mode === 'refresh' ? postsRef.current : null;
    const canRefreshInPlace = mode === 'refresh' && existingPosts !== null;

    if (canRefreshInPlace) {
      setState({ status: 'refreshing', progress: null, posts: existingPosts });
    } else {
      setState({ status: 'loading', progress: null });
    }

    try {
      const posts = await fetchPosts({
        signal: controller.signal,
        onProgress: (progress) => {
          if (controller.signal.aborted) return;
          if (canRefreshInPlace) {
            setState({ status: 'refreshing', progress, posts: existingPosts });
          } else {
            setState({ status: 'loading', progress });
          }
        },
      });

      if (controller.signal.aborted) return;
      postsRef.current = posts;
      setState({ status: 'success', posts });
    } catch (error) {
      if (controller.signal.aborted) return;

      if (error instanceof FetchCancelledError) {
        // Cancelled refresh: silently fall back to the old data.
        if (canRefreshInPlace) {
          setState({ status: 'success', posts: existingPosts });
        } else {
          setState({ status: 'cancelled' });
        }
        return;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      // Failed refresh: keep the table, surface the error next to the button.
      if (canRefreshInPlace) {
        setState({ status: 'refresh-error', message, posts: existingPosts });
      } else {
        setState({ status: 'error', message });
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, []);

  const retry = useCallback(() => {
    void runFetch('initial');
  }, [runFetch]);

  const refresh = useCallback(() => {
    // The refresh button only renders when the table is on screen,
    // so this guard is defensive — it also protects `runFetch` from
    // silently degrading into an initial load.
    if (postsRef.current === null) return;
    void runFetch('refresh');
  }, [runFetch]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // Auto-load on mount; abort on unmount to avoid leaks.
  useEffect(() => {
    void runFetch('initial');
    return () => {
      abortRef.current?.abort();
    };
  }, [runFetch]);

  return { state, retry, cancel, refresh };
}