import { useState } from 'react';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { usePostsQuery } from '@/features/posts/model/usePostsQuery';
import { usePostsSearch } from '@/features/posts/model/usePostsSearch';
import type {
  FullScreenState,
  PostsLoadState,
  PostsLoadedState,
} from '@/features/posts/model/types';
import { PostsLoader } from '@/features/posts/ui/PostsLoader/PostsLoader';
import { PostsTable } from '@/features/posts/ui/PostsTable/PostsTable';
import {
  PostsToolbar,
  type ToolbarRefreshState,
} from '@/features/posts/ui/PostsToolbar/PostsToolbar';
import styles from './PostsPage.module.css';

const SEARCH_DEBOUNCE_MS = 300;

export function PostsPage() {
  const { state, cancel, retry, refresh } = usePostsQuery();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  // Determine posts available for search: real data when loaded, or an empty
  // array while the loader is on screen. Crucially, this is computed *before*
  // the early return so that all hooks run in the same order on every render.
  const postsForSearch = isFullScreenState(state) ? [] : state.posts;
  const filteredPosts = usePostsSearch(postsForSearch, debouncedQuery);

  if (isFullScreenState(state)) {
    return <PostsLoader state={state} onCancel={cancel} onRetry={retry} />;
  }

  const posts = state.posts;

  return (
    <div className={styles.panel}>
      <PostsToolbar
        searchValue={query}
        onSearchChange={setQuery}
        resultCount={filteredPosts.length}
        totalCount={posts.length}
        refreshState={toToolbarRefreshState(state)}
        onRefresh={refresh}
        onCancelRefresh={cancel}
      />
      <PostsTable posts={filteredPosts} highlightQuery={debouncedQuery} />
    </div>
  );
}

/**
 * Narrows the whole state object, not just its `status` string.
 * Lets `PostsPage` branch on loaded-vs-placeholder without casts,
 * and lets `PostsLoader` accept exactly the states it can render.
 */
function isFullScreenState(state: PostsLoadState): state is FullScreenState {
  switch (state.status) {
    case 'idle':
    case 'loading':
    case 'error':
    case 'cancelled':
      return true;
    case 'success':
    case 'refreshing':
    case 'refresh-error':
      return false;
  }
}

/**
 * Maps the loaded state to the toolbar's refresh presentation.
 * `success` → idle, `refreshing` → refreshing, `refresh-error` → error.
 */
function toToolbarRefreshState(
  state: PostsLoadedState,
): ToolbarRefreshState {
  switch (state.status) {
    case 'refreshing':
      return { kind: 'refreshing', progress: state.progress };
    case 'refresh-error':
      return { kind: 'error', message: state.message };
    case 'success':
      return { kind: 'idle' };
  }
}