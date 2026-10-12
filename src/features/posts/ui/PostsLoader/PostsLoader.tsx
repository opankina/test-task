import { Button } from '@/shared/ui/Button/Button';
import type { PostsLoadState } from '../../model/types';
import { ProgressBar } from './ProgressBar';
import styles from './PostsLoader.module.css';

/** All load states except `success` — success is handled by PostsTable. */
type LoadingState = Exclude<PostsLoadState, { status: 'success' }>;

interface PostsLoaderProps {
  state: LoadingState;
  onCancel: () => void;
  onRetry: () => void;
}

export function PostsLoader({ state, onCancel, onRetry }: PostsLoaderProps) {
  switch (state.status) {
    case 'idle':
      // Very brief: the hook auto-starts loading on mount.
      return <div className={styles.container} />;

    case 'loading':
      return (
        <div className={styles.container}>
          <ProgressBar progress={state.progress} />
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      );

    case 'error':
      return (
        <div className={styles.container}>
          <p className={styles.message}>
            Failed to load posts: {state.message}
          </p>
          <Button onClick={onRetry}>Retry</Button>
        </div>
      );

    case 'cancelled':
      return (
        <div className={styles.container}>
          <p className={styles.message}>Loading was cancelled.</p>
          <Button onClick={onRetry}>Retry</Button>
        </div>
      );
  }
}