import { useMemo, useRef } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Post } from '../../model/types';
import { createPostsColumns } from './postsColumns';
import styles from './PostsTable.module.css';

/**
 * Fixed row height in pixels.
 * Must match the visual height of `.row` in the CSS module — otherwise
 * the virtualizer produces gaps or overlaps.
 */
const ROW_HEIGHT_PX = 56;
const OVERSCAN_ROWS = 8;

interface PostsTableProps {
  posts: Post[];
  /** Debounced search query used to highlight matches inside cells. */
  highlightQuery: string;
}

export function PostsTable({ posts, highlightQuery }: PostsTableProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const columns = useMemo(
    () => createPostsColumns(highlightQuery),
    [highlightQuery],
  );

  const table = useReactTable({
    data: posts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;
  const headerGroup = table.getHeaderGroups()[0];

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: OVERSCAN_ROWS,
  });

  /**
   * Shared grid template used by both the header and each row so that
   * columns stay aligned. `size: 0` in the column config means "flexible".
   */
  const gridTemplateColumns = columns
    .map((column) =>
      column.size && column.size > 0 ? `${column.size}px` : 'minmax(0, 1fr)',
    )
    .join(' ');

  const virtualRows = virtualizer.getVirtualItems();

  return (
    <div className={styles.root}>
      {/* Header lives outside the scroll container so it never moves. */}
      {headerGroup && (
        <div
          className={styles.headerRow}
          role="row"
          style={{ gridTemplateColumns }}
        >
          {headerGroup.headers.map((header) => (
            <div
              key={header.id}
              className={styles.headerCell}
              role="columnheader"
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
            </div>
          ))}
        </div>
      )}

      <div ref={scrollContainerRef} className={styles.scrollContainer}>
        {rows.length === 0 ? (
          <div className={styles.empty} role="row">
            No posts match your search.
          </div>
        ) : (
          <div
            className={styles.body}
            role="rowgroup"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];
              if (!row) return null;

              return (
                <div
                  key={row.id}
                  role="row"
                  className={styles.row}
                  style={{
                    gridTemplateColumns,
                    height: `${ROW_HEIGHT_PX}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <div
                      key={cell.id}
                      role="cell"
                      className={styles.cell}
                      data-column={cell.column.id}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}