import { PostsPage } from '@/pages/PostsPage/PostsPage';
import styles from './App.module.css';

/**
 * Application shell: global layout and page outlet.
 * Knows nothing about specific pages — it just renders the header and
 * mounts the current page inside `<main>`.
 */
export function App() {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>Posts Explorer</h1>
      </header>
      <main className={styles.main}>
        <PostsPage />
      </main>
    </div>
  );
}