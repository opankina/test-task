import { Button } from '@/shared/ui/Button/Button';
import { ProgressBar } from '@/shared/ui/ProgressBar/ProgressBar';
import type { FullScreenState } from '../../model/types';
import styles from './PostsLoader.module.css';

interface PostsLoaderProps {
  state: FullScreenState;
  onCancel: () => void;
  onRetry: () => void;
}

export function PostsLoader({ state, onCancel, onRetry }: PostsLoaderProps) {
  switch (state.status) {
    case 'idle':
      return <div className={styles.container} />;

    case 'loading':
      return (
        <div className={styles.container}>
          <ProgressBar progress={state.progress} className={styles.progressBar} />
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      );

    case 'error':
      return (
        <div className={styles.container}>
          <p className={styles.message}>Failed to load posts: {state.message}</p>
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