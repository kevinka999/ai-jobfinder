import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

type TestRow = {
  id: string;
  name: string;
  score?: number;
};

const columns: Array<DataTableColumn<TestRow>> = [
  {
    header: 'Name',
    render: (row) => row.name,
    sortValue: (row) => row.name,
  },
  {
    header: 'Score',
    id: 'score',
    render: (row) => row.score ?? '—',
    sortValue: (row) => row.score,
  },
];

const rows: TestRow[] = [
  { id: 'first', name: 'Backend Engineer', score: 72 },
  { id: 'second', name: 'Frontend Engineer', score: 94 },
  { id: 'third', name: 'Platform Engineer' },
];

describe('DataTable', () => {
  it('sorts by the configured initial column', () => {
    render(
      <DataTable
        columns={columns}
        emptyLabel="No rows."
        getRowKey={(row) => row.id}
        initialSort={{ columnId: 'score', direction: 'desc' }}
        rows={rows}
      />,
    );

    expect(getRenderedNames()).toEqual([
      'Frontend Engineer',
      'Backend Engineer',
      'Platform Engineer',
    ]);
  });

  it('toggles sortable columns from the table header', async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        columns={columns}
        emptyLabel="No rows."
        getRowKey={(row) => row.id}
        initialSort={{ columnId: 'score', direction: 'desc' }}
        rows={rows}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: /sort by score ascending/i }),
    );

    expect(getRenderedNames()).toEqual([
      'Backend Engineer',
      'Frontend Engineer',
      'Platform Engineer',
    ]);

    await user.click(
      screen.getByRole('button', { name: /sort by name ascending/i }),
    );

    expect(getRenderedNames()).toEqual([
      'Backend Engineer',
      'Frontend Engineer',
      'Platform Engineer',
    ]);
  });
});

function getRenderedNames() {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent);
}
