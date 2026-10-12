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
 *   idle ──▶ loading ──▶ success
 *                     ├─▶ error
 *                     └─▶ cancelled
 *
 * From `error` / `cancelled` the user can retry (transition back to `loading`).
 */
export type LoadStatus = 'idle' | 'loading' | 'success' | 'error' | 'cancelled';

/**
 * Discriminated union describing the full loading state.
 * The `status` field narrows the union, so consumers cannot read
 * `posts` while the status is not `success`, etc.
 *
 * `progress` is `number` in [0, 100] when Content-Length is known,
 * or `null` when the total size is unknown (indeterminate).
 */
export type PostsLoadState =
  | { status: 'idle' }
  | { status: 'loading'; progress: number | null }
  | { status: 'success'; posts: Post[] }
  | { status: 'error'; message: string }
  | { status: 'cancelled' };