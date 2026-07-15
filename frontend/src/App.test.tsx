import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { ToastProvider } from './components/ToastProvider';

describe('App', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: createStorageStub(),
    });
    document.documentElement.removeAttribute('data-theme');
    window.localStorage.clear();
  });

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
    expect(screen.getByRole('link', { name: /analytics/i })).toBeInTheDocument();
  });

  it('switches and stores the menu theme', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/job-search']}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </MemoryRouter>,
    );

    expect(document.documentElement).toHaveAttribute('data-theme', 'light');

    const themeSwitch = screen.getByRole('switch', { name: /dark theme/i });

    expect(themeSwitch).not.toBeChecked();

    await user.click(themeSwitch);

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(themeSwitch).toBeChecked();
    expect(window.localStorage.getItem('ai-jobfinder-theme')).toBe('dark');

    await user.click(themeSwitch);

    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(themeSwitch).not.toBeChecked();
    expect(window.localStorage.getItem('ai-jobfinder-theme')).toBe('light');
  });
});

function createStorageStub(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => store.delete(key),
    setItem: (key, value) => store.set(key, value),
  };
}
