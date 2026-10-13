import { useMemo, useRef, type ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import styles from './VirtualTable.module.css';

const DEFAULT_OVERSCAN = 8;

interface VirtualTableProps<TData> {
  data: TData[];
  /**
   * Column definitions from `@tanstack/react-table`.
   * Use `size: 0` (or omit) for a flexible column that takes the
   * remaining space; any positive number is treated as a fixed width
   * in pixels.
   */
  columns: ColumnDef<TData, unknown>[];
  /**
   * Fixed row height in pixels. Must match the visual height of `.row`
   * in VirtualTable.module.css — otherwise the virtualizer will produce
   * gaps or overlaps between rows.
   */
  rowHeightPx: number;
  /** Extra rows rendered above and below the visible window. */
  overscan?: number;
  /** Rendered when `data` is empty. */
  emptyMessage?: ReactNode;
  /** Stable row id resolver. Defaults to the row index. */
  getRowId?: (row: TData, index: number) => string;
}

/**
 * Virtualized table built on top of `@tanstack/react-table` (column model)
 * and `@tanstack/react-virtual` (windowed rendering).
 *
 * Owns nothing domain-specific: consumers pass data and columns,
 * and get back a scrollable, sticky-header table where only the visible
 * slice of rows is mounted in the DOM.
 */
export function VirtualTable<TData>({
  data,
  columns,
  rowHeightPx,
  overscan = DEFAULT_OVERSCAN,
  emptyMessage = 'Nothing to display.',
  getRowId,
}: VirtualTableProps<TData>) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // `exactOptionalPropertyTypes` forbids passing `undefined` explicitly,
    // so we spread conditionally instead of writing `getRowId: getRowId`.
    ...(getRowId ? { getRowId } : {}),
  });

  const rows = table.getRowModel().rows;
  const headerGroup = table.getHeaderGroups()[0];

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => rowHeightPx,
    overscan,
  });

  /**
   * Shared grid template used by both header and each row so columns stay
   * aligned. Built from the column config's `size`.
   */
  const gridTemplateColumns = useMemo(
    () =>
      columns
        .map((column) =>
          column.size && column.size > 0 ? `${column.size}px` : 'minmax(0, 1fr)',
        )
        .join(' '),
    [columns],
  );

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
            {emptyMessage}
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
                    height: `${rowHeightPx}px`,
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