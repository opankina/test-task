import { useId } from 'react';
import styles from './PostsSearch.module.css';

interface PostsSearchProps {
  value: string;
  onChange: (next: string) => void;
  resultCount: number;
  totalCount: number;
}

export function PostsSearch({
  value,
  onChange,
  resultCount,
  totalCount,
}: PostsSearchProps) {
  const inputId = useId();

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={inputId}>
        Search
      </label>
      <input
        id={inputId}
        className={styles.input}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by title or body…"
        autoComplete="off"
        spellCheck={false}
      />
      <span className={styles.counter}>
        {resultCount} of {totalCount}
      </span>
    </div>
  );
}