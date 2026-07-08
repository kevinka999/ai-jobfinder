import type { ApplicationStatus, JobStatus } from '../lib/types';

type StatusBadgeProps = {
  status: JobStatus | ApplicationStatus;
};

const LABELS: Record<string, string> = {
  active: 'Active',
  applied: 'Applied',
  closed: 'Closed',
  draft: 'Draft',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected',
  technical_test: 'Technical test',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge status-${status}`}>{LABELS[status]}</span>;
}
