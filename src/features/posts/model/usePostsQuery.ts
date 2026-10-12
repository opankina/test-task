import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPosts, FetchCancelledError } from '../api/fetchPosts';
import type { PostsLoadState } from './types';

export interface UsePostsQueryResult {
  state: PostsLoadState;
  /** Retry after `error` / `cancelled`. No-op while already loading. */
  retry: () => void;
  /** Abort the in-flight request. No-op unless currently loading. */
  cancel: () => void;
}

/**
 * Owns the posts loading lifecycle: triggers the fetch, tracks progress,
 * exposes cancel/retry.
 *
 * The returned `state` is a discriminated union — render logic can switch
 * on `state.status` and get exhaustive, type-safe handling.
 */
export function usePostsQuery(): UsePostsQueryResult {
  const [state, setState] = useState<PostsLoadState>({ status: 'idle' });
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    // Abort any previous in-flight request before starting a new one.
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: 'loading', progress: null });

    try {
      const posts = await fetchPosts({
        signal: controller.signal,
        onProgress: (progress) => {
          if (controller.signal.aborted) return;
          setState({ status: 'loading', progress });
        },
      });

      if (controller.signal.aborted) return;
      setState({ status: 'success', posts });
    } catch (error) {
      if (error instanceof FetchCancelledError) {
        setState({ status: 'cancelled' });
        return;
      }
      if (controller.signal.aborted) return; // safety net
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState({ status: 'error', message });
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, []);

  const retry = useCallback(() => {
    void load();
  }, [load]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // Auto-load on mount; abort on unmount to avoid leaks.
  useEffect(() => {
    void load();
    return () => {
      abortRef.current?.abort();
    };
  }, [load]);

  return { state, retry, cancel };
}