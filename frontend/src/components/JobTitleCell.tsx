import type { ReactNode } from 'react';
import type { JobResponse } from '../lib/types';

export function JobTitleCell({
  companyMeta,
  job,
}: {
  companyMeta?: ReactNode;
  job: JobResponse;
}) {
  return (
    <div className="grid min-w-0 max-w-[min(64vw,36rem)] gap-1">
      <strong className="block text-app-text">{job.title}</strong>
      <div className="flex min-w-0 items-center gap-1.5">
        <span
          className="min-w-0 truncate text-sm text-app-text-muted"
          title={job.companyName}
        >
          {job.companyName}
        </span>
        {companyMeta}
      </div>
    </div>
  );
}
