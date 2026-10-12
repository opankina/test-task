import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  /** Percentage in [0, 100], or `null` for indeterminate mode. */
  progress: number | null;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  const isIndeterminate = progress === null;

  return (
    <div className={styles.wrapper}>
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