import { ExternalLink } from 'lucide-react';
import type { JobResponse } from '../lib/types';

export function JobTitleCell({ job }: { job: JobResponse }) {
  return (
    <div className="grid gap-1">
      <strong className="block text-app-text">{job.title}</strong>
      <span className="block text-sm text-app-text-muted">
        {job.companyName}
      </span>
      <a
        className="inline-flex w-fit items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-800"
        href={job.applicationUrl}
        rel="noreferrer"
        target="_blank"
      >
        <ExternalLink size={13} />
        Open
      </a>
    </div>
  );
}
