import { Button } from '@/shared/ui/Button/Button';
import { ProgressBar } from '@/shared/ui/ProgressBar/ProgressBar';
import { PostsSearch } from '../PostsSearch/PostsSearch';
import styles from './PostsToolbar.module.css';

/**
 * What the toolbar should show for the refresh area.
 * Exactly one of three presentations at any time.
 */
export type ToolbarRefreshState =
  | { kind: 'idle' }
  | { kind: 'refreshing'; progress: number | null }
  | { kind: 'error'; message: string };

interface PostsToolbarProps {
  // Search
  searchValue: string;
  onSearchChange: (next: string) => void;
  resultCount: number;
  totalCount: number;
  // Refresh
  refreshState: ToolbarRefreshState;
  onRefresh: () => void;
  onCancelRefresh: () => void;
}

/**
 * Composite toolbar for the posts page:
 * search input on the left, result counter and refresh controls on the right.
 */
export function PostsToolbar({
  searchValue,
  onSearchChange,
  resultCount,
  totalCount,
  refreshState,
  onRefresh,
  onCancelRefresh,
}: PostsToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <PostsSearch value={searchValue} onChange={onSearchChange} />

      <span className={styles.counter}>
        {resultCount} of {totalCount}
      </span>

      <div className={styles.refreshArea}>
        {refreshState.kind === 'refreshing' && (
          <>
            <ProgressBar
              progress={refreshState.progress}
              className={styles.progress}
            />
            <Button
              variant="secondary"
              onClick={onCancelRefresh}
              aria-label="Cancel refresh"
              title="Cancel refresh"
            >
              ✕
            </Button>
          </>
        )}

        {refreshState.kind === 'error' && (
          <>
            <span className={styles.refreshError} role="alert">
              Refresh failed: {refreshState.message}
            </span>
            <Button
              variant="secondary"
              onClick={onRefresh}
              aria-label="Retry refresh"
              title="Retry refresh"
            >
              ⟳
            </Button>
          </>
        )}

        {refreshState.kind === 'idle' && (
          <Button
            variant="secondary"
            onClick={onRefresh}
            aria-label="Refresh"
            title="Refresh"
          >
            ⟳
          </Button>
        )}
      </div>
    </div>
  );
}