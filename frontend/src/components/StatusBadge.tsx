import type { ApplicationStatus, JobStatus } from '../lib/types';
import { cx } from '../lib/classNames';

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
  return (
    <span
      className={cx(
        'inline-flex min-h-6 items-center rounded-pill px-2 text-xs font-bold',
        ['active', 'interviewing', 'offer'].includes(status) &&
          'bg-brand-100 text-brand-700',
        ['draft', 'technical_test'].includes(status) &&
          'bg-warning-50 text-warning-700',
        status === 'applied' && 'bg-accent-50 text-accent-700',
        ['rejected', 'closed'].includes(status) &&
          'bg-danger-100 text-danger-700',
      )}
    >
      {LABELS[status]}
    </span>
  );
}
