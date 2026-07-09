import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { ToastProvider } from './components/ToastProvider';

describe('App', () => {
  it('renders the workflow navigation', () => {
    render(
      <MemoryRouter initialEntries={['/job-search']}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /job search/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^jobs$/i })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /applications/i }),
    ).toBeInTheDocument();
  });
});
