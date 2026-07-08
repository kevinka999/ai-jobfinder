import { BriefcaseBusiness, FileSearch, Files, UserRound } from 'lucide-react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
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
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark">AJ</span>
          <div>
            <strong>AI Jobfinder</strong>
            <span>Private workspace</span>
          </div>
        </div>
        <nav className="nav-list" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
                key={item.to}
                to={item.to}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <main className="main-surface">
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
