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
    return (
      <div className="rounded-panel border border-dashed border-app-border px-panel py-panel text-app-text-muted">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                className="border-b border-app-border px-2.5 py-2 text-left align-top text-xs font-bold text-app-text-muted"
                key={column.header}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td
                  className="border-b border-app-border px-2.5 py-2 align-top"
                  key={column.header}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
