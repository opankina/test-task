import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  /** Percentage in [0, 100], or `null` for indeterminate mode. */
  progress: number | null;
  /** Optional consumer class for width and spacing overrides. */
  className?: string | undefined;
}

/**
 * Generic determinate/indeterminate progress bar.
 * Knows nothing about what it is measuring.
 *
 * When `progress` is `null`, renders a sliding indicator instead of
 * a fixed-width fill. Used for chunked responses without Content-Length.
 */
export function ProgressBar({ progress, className }: ProgressBarProps) {
  const isIndeterminate = progress === null;

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      <div className={styles.track}>
        <div
          className={
            isIndeterminate ? `${styles.fill} ${styles.indeterminate}` : styles.fill
          }
          style={isIndeterminate ? undefined : { width: `${progress}%` }}
        />
      </div>
      <span className={styles.label}>
        {isIndeterminate ? 'Loading…' : `${progress}%`}
      </span>
    </div>
  );
}