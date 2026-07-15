import { useEffect, useState } from 'react';
import {
  BriefcaseBusiness,
  BarChart3,
  FileSearch,
  Files,
  Moon,
  Sun,
  UserRound,
} from 'lucide-react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { cx } from './lib/classNames';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { JobSearchPage } from './pages/JobSearchPage';
import { JobsPage } from './pages/JobsPage';
import { ProfilePage } from './pages/ProfilePage';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'ai-jobfinder-theme';

const NAV_ITEMS: Array<{
  to: string;
  label: string;
  icon: typeof UserRound;
}> = [
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/job-search', label: 'Job Search', icon: FileSearch },
  { to: '/jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { to: '/applications', label: 'Applications', icon: Files },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const ThemeIcon = theme === 'dark' ? Moon : Sun;
  const themeButtonLabel = `Switch to ${nextTheme} theme`;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    getThemeStorage()?.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <div className="grid h-screen grid-cols-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden md:grid-cols-[244px_minmax(0,1fr)] md:grid-rows-1">
      <aside className="z-10 flex h-full flex-col overflow-hidden border-b border-app-border bg-app-surface-raised p-2.5 md:border-b-0 md:border-r md:px-3.5 md:py-[18px]">
        <div className="mb-2.5 flex min-h-10 items-center gap-inline md:mb-[22px]">
          <div>
            <strong className="block text-sm font-bold text-app-text">
              AI Jobfinder
            </strong>
            <span className="block text-xs text-app-text-muted">
              Private workspace
            </span>
          </div>
        </div>
        <nav
          className="grid grid-cols-5 gap-1 md:grid-cols-1"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                className={({ isActive }) =>
                  cx(
                    'inline-flex min-h-9 w-full items-center justify-center gap-inline rounded-control border border-transparent px-1.5 text-app-text-soft transition-colors hover:border-brand-200 hover:bg-brand-100 hover:text-brand-700 md:justify-start md:px-2.5',
                    isActive &&
                      'border-brand-200 bg-brand-100 text-brand-700',
                  )
                }
                key={item.to}
                to={item.to}
              >
                <Icon size={17} />
                <span className="hidden md:inline">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <button
          aria-checked={theme === 'dark'}
          aria-label="Dark theme"
          className="mt-2.5 inline-flex min-h-9 w-full cursor-pointer items-center gap-inline rounded-control border border-transparent px-1.5 text-app-text-soft transition-colors hover:border-brand-200 hover:bg-brand-100 hover:text-brand-700 md:mt-auto md:px-2.5"
          onClick={() => setTheme(nextTheme)}
          role="switch"
          title={themeButtonLabel}
          type="button"
        >
          <ThemeIcon size={17} />
          <span className="hidden text-sm font-semibold md:inline">
            Dark theme
          </span>
          <span
            className={cx(
              'ml-auto inline-flex h-6 w-11 shrink-0 items-center rounded-pill border p-0.5 transition-colors',
              theme === 'dark'
                ? 'border-brand-600 bg-brand-600'
                : 'border-app-border-strong bg-app-surface-muted',
            )}
          >
            <span
              className={cx(
                'size-5 rounded-pill bg-app-surface shadow-sm transition-transform',
                theme === 'dark' && 'translate-x-5 bg-brand-contrast',
              )}
            />
          </span>
        </button>
      </aside>
      <main className="min-h-0 min-w-0 overflow-y-auto p-page-mobile md:p-page">
        <Routes>
          <Route element={<ProfilePage />} path="/profile" />
          <Route element={<JobSearchPage />} path="/job-search" />
          <Route element={<JobsPage />} path="/jobs" />
          <Route element={<ApplicationsPage />} path="/applications" />
          <Route element={<AnalyticsPage />} path="/analytics" />
          <Route element={<Navigate replace to="/profile" />} path="*" />
        </Routes>
      </main>
    </div>
  );
}

function getInitialTheme(): Theme {
  const storedTheme = getThemeStorage()?.getItem(THEME_STORAGE_KEY);

  return storedTheme === 'dark' ? 'dark' : 'light';
}

function getThemeStorage(): Storage | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
