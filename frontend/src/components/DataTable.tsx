import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { cx } from '../lib/classNames';

type DataTableSortValue = boolean | Date | number | string | null | undefined;
type DataTableSortDirection = 'asc' | 'desc';

export type DataTableSortState = {
  columnId: string;
  direction: DataTableSortDirection;
};

export type DataTableColumn<T> = {
  defaultSortDirection?: DataTableSortDirection;
  header: string;
  id?: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => DataTableSortValue;
};

type DataTableProps<T> = {
  columns: Array<DataTableColumn<T>>;
  emptyLabel: string;
  getRowKey: (row: T) => string;
  initialSort?: DataTableSortState | null;
  rows: T[];
};

const sortCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

export function DataTable<T>({
  columns,
  emptyLabel,
  getRowKey,
  initialSort = null,
  rows,
}: DataTableProps<T>) {
  const [sortState, setSortState] = useState<DataTableSortState | null>(
    initialSort,
  );
  const sortedRows = useMemo(
    () => sortRows(rows, columns, sortState),
    [columns, rows, sortState],
  );

  if (rows.length === 0) {
    return (
      <div className="grid gap-1.5">
        <TableItemCount count={rows.length} />
        <div className="rounded-panel border border-dashed border-app-border px-panel py-panel text-app-text-muted">
          {emptyLabel}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-1.5">
      <TableItemCount count={rows.length} />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  className="border-b border-app-border px-2.5 py-2 text-left align-top text-xs font-bold text-app-text-muted"
                  aria-sort={getAriaSort(column, sortState)}
                  key={getColumnId(column)}
                >
                  {column.sortValue ? (
                    <button
                      aria-label={getSortButtonLabel(column, sortState)}
                      className="inline-flex items-center gap-1 rounded-control text-left font-bold text-app-text-muted transition-colors hover:text-app-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                      onClick={() =>
                        setSortState(getNextSortState(column, sortState))
                      }
                      type="button"
                    >
                      <span>{column.header}</span>
                      {getSortIcon(column, sortState)}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) => (
                  <td
                    className="border-b border-app-border px-2.5 py-2 align-middle"
                    key={getColumnId(column)}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableItemCount({ count }: { count: number }) {
  return (
    <p className="m-0 text-right text-sm font-bold text-app-text-muted">
      {count} {count === 1 ? 'item' : 'items'}
    </p>
  );
}

function getColumnId<T>(column: DataTableColumn<T>) {
  return column.id ?? column.header;
}

function getNextSortState<T>(
  column: DataTableColumn<T>,
  sortState: DataTableSortState | null,
): DataTableSortState {
  const columnId = getColumnId(column);

  if (sortState?.columnId !== columnId) {
    return { columnId, direction: column.defaultSortDirection ?? 'asc' };
  }

  return {
    columnId,
    direction: sortState.direction === 'asc' ? 'desc' : 'asc',
  };
}

function getAriaSort<T>(
  column: DataTableColumn<T>,
  sortState: DataTableSortState | null,
) {
  if (!column.sortValue || sortState?.columnId !== getColumnId(column)) {
    return 'none';
  }

  return sortState.direction === 'asc' ? 'ascending' : 'descending';
}

function getSortButtonLabel<T>(
  column: DataTableColumn<T>,
  sortState: DataTableSortState | null,
) {
  const nextState = getNextSortState(column, sortState);
  const directionLabel =
    nextState.direction === 'asc' ? 'ascending' : 'descending';

  return `Sort by ${column.header} ${directionLabel}`;
}

function getSortIcon<T>(
  column: DataTableColumn<T>,
  sortState: DataTableSortState | null,
) {
  const iconClassName = cx(
    'shrink-0',
    sortState?.columnId === getColumnId(column)
      ? 'text-app-text'
      : 'text-app-text-muted',
  );

  if (sortState?.columnId !== getColumnId(column)) {
    return <ArrowUpDown aria-hidden="true" className={iconClassName} size={13} />;
  }

  if (sortState.direction === 'asc') {
    return <ArrowUp aria-hidden="true" className={iconClassName} size={13} />;
  }

  return <ArrowDown aria-hidden="true" className={iconClassName} size={13} />;
}

function sortRows<T>(
  rows: T[],
  columns: Array<DataTableColumn<T>>,
  sortState: DataTableSortState | null,
) {
  if (!sortState) {
    return rows;
  }

  const sortedColumn = columns.find(
    (column) => getColumnId(column) === sortState.columnId,
  );

  if (!sortedColumn?.sortValue) {
    return rows;
  }

  return rows
    .map((row, index) => ({ index, row }))
    .sort((left, right) => {
      const comparison = compareSortValues({
        direction: sortState.direction,
        left: sortedColumn.sortValue?.(left.row),
        right: sortedColumn.sortValue?.(right.row),
      });

      if (comparison === 0) {
        return left.index - right.index;
      }

      return comparison;
    })
    .map(({ row }) => row);
}

function compareSortValues({
  direction,
  left,
  right,
}: {
  direction: DataTableSortDirection;
  left: DataTableSortValue;
  right: DataTableSortValue;
}) {
  const leftIsBlank = left === null || left === undefined || left === '';
  const rightIsBlank = right === null || right === undefined || right === '';

  if (leftIsBlank && rightIsBlank) {
    return 0;
  }

  if (leftIsBlank) {
    return 1;
  }

  if (rightIsBlank) {
    return -1;
  }

  const normalizedLeft = left instanceof Date ? left.getTime() : left;
  const normalizedRight = right instanceof Date ? right.getTime() : right;

  if (
    typeof normalizedLeft === 'number' &&
    typeof normalizedRight === 'number'
  ) {
    return direction === 'asc'
      ? normalizedLeft - normalizedRight
      : normalizedRight - normalizedLeft;
  }

  const comparison = sortCollator.compare(
    String(normalizedLeft),
    String(normalizedRight),
  );

  return direction === 'asc' ? comparison : -comparison;
}
