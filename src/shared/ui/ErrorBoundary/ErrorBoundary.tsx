import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../Button/Button';
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render-time errors in the subtree and shows a fallback UI
 * instead of the dreaded blank screen.
 *
 * What it does NOT catch (by React design):
 *  - errors in event handlers (`onClick`, `onChange`) — use try/catch there
 *  - async errors (promises, setTimeout) — handle them where they originate
 *  - errors thrown in the boundary itself
 *
 * Those categories are already handled elsewhere in this app:
 * `usePostsQuery` owns network failures via `error` / `refresh-error` states.
 * This boundary is the last-resort safety net for unexpected bugs.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // In a real app this is where you'd report to Sentry / LogRocket / etc.
    // Keeping console.error is enough for a test task.
    console.error('Uncaught error in render:', error, info.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className={styles.container} role="alert">
        <h1 className={styles.title}>Something went wrong</h1>
        <p className={styles.message}>
          The page hit an unexpected error. You can try again — if it keeps
          happening, please reload the page.
        </p>
        {import.meta.env.DEV && (
          <pre className={styles.details}>{error.message}</pre>
        )}
        <Button onClick={this.handleReset}>Try again</Button>
      </div>
    );
  }
}