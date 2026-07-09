import { ExternalLink } from 'lucide-react';
import type { JobResponse } from '../lib/types';

export function JobOpenLink({ job }: { job: JobResponse }) {
  return (
    <a
      aria-label={`Open ${job.title} at ${job.companyName}`}
      className="inline-flex min-h-9 w-9 items-center justify-center rounded-control border border-app-border bg-app-surface text-app-text transition-colors hover:bg-app-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      href={job.applicationUrl}
      rel="noreferrer"
      target="_blank"
    >
      <ExternalLink aria-hidden="true" size={15} />
    </a>
  );
}
