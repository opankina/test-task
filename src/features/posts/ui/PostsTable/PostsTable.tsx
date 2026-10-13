import { useMemo } from 'react';
import { VirtualTable } from '@/shared/ui/VirtualTable/VirtualTable';
import type { Post } from '../../model/types';
import { createPostsColumns } from './postsColumns';

/**
 * Fixed row height in pixels. 56px accommodates a two-line clamped `body`
 * cell without looking cramped.
 */
const ROW_HEIGHT_PX = 56;

interface PostsTableProps {
  posts: Post[];
  /** Debounced search query used to highlight matches inside cells. */
  highlightQuery: string;
}

export function PostsTable({ posts, highlightQuery }: PostsTableProps) {
  const columns = useMemo(
    () => createPostsColumns(highlightQuery),
    [highlightQuery],
  );

  return (
    <VirtualTable
      data={posts}
      columns={columns}
      rowHeightPx={ROW_HEIGHT_PX}
      emptyMessage="No posts match your search."
      getRowId={(post) => String(post.id)}
    />
  );
}