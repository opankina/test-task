import { useId } from 'react';
import styles from './PostsSearch.module.css';

interface PostsSearchProps {
  value: string;
  onChange: (next: string) => void;
}

/**
 * Controlled search input.
 * Owns nothing but the text field — the result counter lives in the toolbar,
 * where it can sit next to the refresh controls.
 */
export function PostsSearch({ value, onChange }: PostsSearchProps) {
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
    </div>
  );
}