import type { JobResponse } from '../lib/types';

export function JobTitleCell({ job }: { job: JobResponse }) {
  return (
    <div className="grid min-w-0 max-w-[min(64vw,36rem)] gap-1">
      <strong className="block text-app-text">{job.title}</strong>
      <span
        className="block truncate text-sm text-app-text-muted"
        title={job.companyName}
      >
        {job.companyName}
      </span>
    </div>
  );
}
