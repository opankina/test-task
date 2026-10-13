/**
 * A single post from the remote API.
 * Matches the shape of https://rtcoder.github.io/fake-api/posts.json
 */
export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

/**
 * Finite states for the posts loading lifecycle.
 *
 *   idle ──▶ loading ──▶ success ──▶ refreshing ──▶ success
 *                     ├─▶ error                  ├─▶ refresh-error
 *                     └─▶ cancelled               └─▶ (cancel) success
 *
 * `refreshing` and `refresh-error` both carry the currently displayed
 * posts, so the table can stay on screen while a background reload runs.
 */
export type LoadStatus =
  | 'idle'
  | 'loading'
  | 'refreshing'
  | 'success'
  | 'refresh-error'
  | 'error'
  | 'cancelled';

/**
 * Discriminated union describing the full loading state.
 * The `status` field narrows the union, so consumers cannot read
 * `posts` while the status is not `success` / `refreshing` / `refresh-error`.
 *
 * `progress` is `number` in [0, 100] when Content-Length is known,
 * or `null` when the total size is unknown (indeterminate).
 */
export type PostsLoadState =
  | { status: 'idle' }
  | { status: 'loading'; progress: number | null }
  | { status: 'refreshing'; progress: number | null; posts: Post[] }
  | { status: 'success'; posts: Post[] }
  | { status: 'refresh-error'; message: string; posts: Post[] }
  | { status: 'error'; message: string }
  | { status: 'cancelled' };

/** Subset of states in which the table is displayed. */
export type PostsLoadedState = Extract<
  PostsLoadState,
  { status: 'success' | 'refreshing' | 'refresh-error' }
>;

/**
 * Subset of states rendered as a full-screen placeholder
 * (no data on screen yet, or a fatal error).
 */
export type FullScreenState = Extract<
  PostsLoadState,
  { status: 'idle' | 'loading' | 'error' | 'cancelled' }
>;