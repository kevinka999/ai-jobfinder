import type { ReactNode } from 'react';

export type DataTableColumn<T> = {
  header: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: Array<DataTableColumn<T>>;
  emptyLabel: string;
  getRowKey: (row: T) => string;
  rows: T[];
};

export function DataTable<T>({
  columns,
  emptyLabel,
  getRowKey,
  rows,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return <div className="empty-table">{emptyLabel}</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.header}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td key={column.header}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
