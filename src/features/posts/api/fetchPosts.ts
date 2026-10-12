import type { Post } from '../model/types';

const POSTS_ENDPOINT = 'https://rtcoder.github.io/fake-api/posts.json';

/**
 * Thrown when the request was intentionally aborted by the caller.
 * Distinguishing this from generic errors lets the UI show
 * "cancelled" instead of "error".
 */
export class FetchCancelledError extends Error {
  constructor() {
    super('Request was cancelled');
    this.name = 'FetchCancelledError';
  }
}

/**
 * Thrown when the server responded with a non-2xx status.
 * Keeps the HTTP status code for diagnostics.
 */
export class FetchHttpError extends Error {
  constructor(public readonly status: number) {
    super(`Request failed with status ${status}`);
    this.name = 'FetchHttpError';
  }
}

export interface FetchPostsOptions {
  /** Optional AbortSignal to cancel the request. */
  signal?: AbortSignal;
  /**
   * Called repeatedly while the response body is being read.
   * Receives a percentage in [0, 100], or `null` when the total
   * size is unknown (Content-Length header is absent).
   */
  onProgress?: (progress: number | null) => void;
}

/**
 * Downloads the posts JSON, reporting progress as it reads the body.
 *
 * Uses fetch + ReadableStream so that we can observe bytes as they arrive.
 * Progress is computed against the `Content-Length` header. When the header
 * is missing (e.g. chunked transfer), `onProgress` is called with `null`
 * and the caller falls back to an indeterminate indicator.
 */
export async function fetchPosts(options: FetchPostsOptions = {}): Promise<Post[]> {
  const { signal, onProgress } = options;

  try {
    const response = await fetch(POSTS_ENDPOINT, {
      ...(signal ? { signal } : {}),
    });

    if (!response.ok) {
      throw new FetchHttpError(response.status);
    }

    if (!response.body) {
      // Fallback for environments without streaming support.
      // Progress is reported as completed because we cannot observe chunks.
      const posts = (await response.json()) as Post[];
      onProgress?.(100);
      return posts;
    }

    const totalBytes = readContentLength(response);
    return await readJsonStream(response.body, totalBytes, onProgress);
  } catch (error) {
    // fetch() / reader.read() both throw AbortError on abort.
    // Normalise it to our domain error.
    if (isAbortError(error)) {
      throw new FetchCancelledError();
    }
    throw error;
  }
}

function readContentLength(response: Response): number | null {
  const header = response.headers.get('Content-Length');
  if (!header) return null;
  const parsed = Number(header);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

async function readJsonStream(
  body: ReadableStream<Uint8Array>,
  totalBytes: number | null,
  onProgress: FetchPostsOptions['onProgress'],
): Promise<Post[]> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    receivedBytes += value.byteLength;

    if (totalBytes !== null) {
      const percent = Math.min(100, Math.round((receivedBytes / totalBytes) * 100));
      onProgress?.(percent);
    } else {
      onProgress?.(null);
    }
  }

  const text = new TextDecoder('utf-8').decode(concatChunks(chunks, receivedBytes));
  const posts = JSON.parse(text) as Post[];
  onProgress?.(100);
  return posts;
}

function concatChunks(chunks: Uint8Array[], totalLength: number): Uint8Array {
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  );
}