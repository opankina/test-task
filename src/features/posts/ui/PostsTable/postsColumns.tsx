import type { ColumnDef } from '@tanstack/react-table';
import { Tooltip } from '@/shared/ui/Tooltip/Tooltip';
import type { Post } from '../../model/types';
import { HighlightedText } from './HighlightedText';
import styles from './PostsTable.module.css';

export function createPostsColumns(query: string): ColumnDef<Post>[] {
  return [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 80,
      cell: ({ getValue }) => (
        <span className={styles.numericCell}>{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: 'userId',
      header: 'User',
      size: 100,
      cell: ({ getValue }) => (
        <span className={styles.numericCell}>{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Title',
      size: 0,
      cell: ({ row }) => (
        <Tooltip
          onlyWhenTruncated
          className={styles.truncatedSingle}
          content={<HighlightedText text={row.original.title} query={query} />}
        >
          <HighlightedText text={row.original.title} query={query} />
        </Tooltip>
      ),
    },
    {
      accessorKey: 'body',
      header: 'Body',
      size: 0,
      cell: ({ row }) => (
        <Tooltip
          onlyWhenTruncated
          className={styles.truncatedMultiline}
          content={<HighlightedText text={row.original.body} query={query} />}
        >
          <HighlightedText text={row.original.body} query={query} />
        </Tooltip>
      ),
    },
  ];
}