import { BriefcaseBusiness, FileSearch, Files, UserRound } from 'lucide-react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { cx } from './lib/classNames';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { JobSearchPage } from './pages/JobSearchPage';
import { JobsPage } from './pages/JobsPage';
import { ProfilePage } from './pages/ProfilePage';

const NAV_ITEMS: Array<{
  to: string;
  label: string;
  icon: typeof UserRound;
}> = [
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/job-search', label: 'Job Search', icon: FileSearch },
  { to: '/jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { to: '/applications', label: 'Applications', icon: Files },
];

export function App() {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[244px_minmax(0,1fr)]">
      <aside className="sticky top-0 z-10 border-b border-app-border bg-app-surface-raised p-2.5 md:static md:border-b-0 md:border-r md:px-3.5 md:py-[18px]">
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
          className="grid grid-cols-4 gap-1 md:grid-cols-1"
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
      </aside>
      <main className="min-w-0 p-page-mobile md:p-page">
        <Routes>
          <Route element={<ProfilePage />} path="/profile" />
          <Route element={<JobSearchPage />} path="/job-search" />
          <Route element={<JobsPage />} path="/jobs" />
          <Route element={<ApplicationsPage />} path="/applications" />
          <Route element={<Navigate replace to="/profile" />} path="*" />
        </Routes>
      </main>
    </div>
  );
}
