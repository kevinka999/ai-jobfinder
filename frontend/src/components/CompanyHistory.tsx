import { ExternalLink } from 'lucide-react';
import { Drawer } from './Drawer';
import { StatusBadge } from './StatusBadge';
import type { CompanyApplicationHistoryResponse } from '../lib/types';

type CompanyHistoryBadgeProps = {
  history?: CompanyApplicationHistoryResponse;
  isLoading: boolean;
  onOpen: (history: CompanyApplicationHistoryResponse) => void;
};

export function CompanyHistoryBadge({
  history,
  isLoading,
  onOpen,
}: CompanyHistoryBadgeProps) {
  if (isLoading && !history) {
    return (
      <span
        aria-label="Loading company applications"
        className="inline-block size-5 shrink-0 animate-pulse rounded-full bg-app-border align-middle"
      />
    );
  }

  const matchCount = history?.matchCount ?? 0;

  if (matchCount === 0 || !history) {
    return (
      <span
        aria-label="No previous company applications"
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-app-border bg-app-surface-muted text-[11px] font-bold text-app-text-muted"
      >
        0
      </span>
    );
  }

  return (
    <button
      aria-label={`${matchCount} previous company applications`}
      className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-brand-contrast shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      onClick={() => onOpen(history)}
      title="Show previous applications at this company"
      type="button"
    >
      {matchCount}
    </button>
  );
}

export function CompanyHistoryDrawer({
  history,
  onClose,
}: {
  history: CompanyApplicationHistoryResponse | null;
  onClose: () => void;
}) {
  return (
    <Drawer
      onClose={onClose}
      open={!!history}
      title={history ? `${history.companyName} Applications` : 'Applications'}
    >
      <div className="grid gap-inline">
        {history?.applications.map((application) => (
          <div
            className="grid gap-2 border-b border-app-border py-2 last:border-b-0"
            key={application.id}
          >
            <div className="flex items-start justify-between gap-cluster">
              <div className="grid min-w-0 gap-1">
                <span className="min-w-0 font-semibold text-app-text">
                  {application.title}
                </span>
                {application.techStack && application.techStack.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {application.techStack.map((tech) => (
                      <span
                        className="rounded-pill border border-app-border bg-app-surface-muted px-2 py-0.5 text-xs font-semibold text-app-text-muted"
                        key={tech}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-inline">
                <StatusBadge status={application.status} />
                <a
                  aria-label={`Open ${application.title}`}
                  className="inline-flex min-h-8 w-8 cursor-pointer items-center justify-center rounded-control border border-app-border bg-app-surface text-app-text transition-colors hover:bg-app-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                  href={application.applicationUrl}
                  rel="noreferrer"
                  target="_blank"
                  title="Open application"
                >
                  <ExternalLink aria-hidden="true" size={14} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Drawer>
  );
}
