import { useState } from 'react';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { usePostsQuery } from '@/features/posts/model/usePostsQuery';
import { usePostsSearch } from '@/features/posts/model/usePostsSearch';
import { PostsLoader } from '@/features/posts/ui/PostsLoader/PostsLoader';
import { PostsSearch } from '@/features/posts/ui/PostsSearch/PostsSearch';
import { PostsTable } from '@/features/posts/ui/PostsTable/PostsTable';
import styles from './App.module.css';

const SEARCH_DEBOUNCE_MS = 300;

export function App() {
  const { state, cancel, retry } = usePostsQuery();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  // While the loading is not successful, `usePostsSearch` gets an empty array.
  const posts = state.status === 'success' ? state.posts : [];
  const filteredPosts = usePostsSearch(posts, debouncedQuery);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>Posts Explorer</h1>
      </header>

      <main className={styles.main}>
        {state.status === 'success' ? (
          <div className={styles.panel}>
            <PostsSearch
              value={query}
              onChange={setQuery}
              resultCount={filteredPosts.length}
              totalCount={state.posts.length}
            />
            <PostsTable posts={filteredPosts} highlightQuery={debouncedQuery} />
          </div>
        ) : (
          <PostsLoader state={state} onCancel={cancel} onRetry={retry} />
        )}
      </main>
    </div>
  );
}