import type { ColumnDef } from '@tanstack/react-table';
import type { Post } from '../../model/types';
import { HighlightedText } from './HighlightedText';
import styles from './PostsTable.module.css';

/**
 * Builds the column definitions for the posts table.
 *
 * Widths are declared here (`size`) and consumed by PostsTable to
 * compose a CSS grid template. `size: 0` means "flexible" — the column
 * receives the remaining space.
 */
export function createPostsColumns(query: string): ColumnDef<Post>[] {
  return [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 80,
    },
    {
      accessorKey: 'userId',
      header: 'User',
      size: 100,
    },
    {
      accessorKey: 'title',
      header: 'Title',
      size: 250,
      cell: ({ row }) => (
        <HighlightedText text={row.original.title} query={query} />
      ),
    },
    {
      accessorKey: 'body',
      header: 'Body',
      size: 0,
      cell: ({ row }) => (
        <span className={styles.bodyText}>
          <HighlightedText text={row.original.body} query={query} />
        </span>
      ),
    },
  ];
}