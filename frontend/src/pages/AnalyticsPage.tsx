import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Send,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { ErrorState } from '../components/ErrorState';
import {
  fieldClassName,
  fieldLabelClassName,
  inputClassName,
} from '../components/Field';
import { LoadingState } from '../components/LoadingState';
import { useToast } from '../components/toastContext';
import {
  pageHeadingClass,
  pageStackClass,
  pageTitleClass,
  panelSectionClass,
  panelTitleClass,
} from '../design/classes';
import { apiRequest } from '../lib/api';
import type { ApplicationResponse, ApplicationStatus } from '../lib/types';

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  tone?: 'accent' | 'brand' | 'danger' | 'warning';
  value: number;
};

type AnalyticsMetrics = {
    daily: {
      applied: number;
    goodNews: number;
      rejected: number;
    };
  inProcess: number;
  rejected: number;
  totalApplied: number;
  waitingReply: number;
};

export function AnalyticsPage() {
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [selectedDate, setSelectedDate] = useState(() =>
    toLocalDateInputValue(new Date()),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const loadApplications = useCallback(async (showSuccessToast = false) => {
    setIsLoading(true);
    setError(null);

    try {
      setApplications(await apiRequest<ApplicationResponse[]>('/applications'));
      if (showSuccessToast) {
        toast.success('Analytics refreshed');
      }
    } catch (caughtError) {
      const message = getErrorMessage(caughtError);
      setError(message);
      toast.error(`Could not load analytics: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const metrics = useMemo(
    () => getAnalyticsMetrics(applications, selectedDate),
    [applications, selectedDate],
  );

  return (
    <section className={pageStackClass}>
      <div className={pageHeadingClass}>
        <h1 className={pageTitleClass}>Analytics</h1>
        <Button
          icon={<RefreshCw size={16} />}
          isLoading={isLoading}
          onClick={() => loadApplications(true)}
        >
          Refresh
        </Button>
      </div>
      {error ? <ErrorState message={error} /> : null}
      {isLoading ? <LoadingState label="Loading analytics" /> : null}
      <section className={panelSectionClass}>
        <div>
          <h2 className={panelTitleClass}>General overview</h2>
          <p className="m-0 mt-1 text-sm text-app-text-muted">
            Current application status across all tracked jobs.
          </p>
        </div>
        <div className="grid gap-cluster sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Send}
            label="Jobs applied"
            tone="brand"
            value={metrics.totalApplied}
          />
          <MetricCard
            icon={XCircle}
            label="Rejected"
            tone="danger"
            value={metrics.rejected}
          />
          <MetricCard
            icon={Clock3}
            label="Waiting reply"
            tone="accent"
            value={metrics.waitingReply}
          />
          <MetricCard
            icon={Activity}
            label="In process"
            tone="warning"
            value={metrics.inProcess}
          />
        </div>
      </section>
      <section className={panelSectionClass}>
        <div className="grid gap-cluster lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
          <div>
            <h2 className={panelTitleClass}>Daily overview</h2>
            <p className="m-0 mt-1 text-sm text-app-text-muted">
              Counts applications created and status movements recorded on the
              selected day.
            </p>
          </div>
          <label className={fieldClassName}>
            <span className={fieldLabelClassName}>Day</span>
            <input
              aria-label="Analytics date"
              className={inputClassName}
              onChange={(event) => setSelectedDate(event.target.value)}
              type="date"
              value={selectedDate}
            />
          </label>
        </div>
        <div className="grid gap-cluster sm:grid-cols-3">
          <MetricCard
            icon={CalendarDays}
            label="Applied on this day"
            tone="accent"
            value={metrics.daily.applied}
          />
          <MetricCard
            icon={XCircle}
            label="Rejected on this day"
            tone="danger"
            value={metrics.daily.rejected}
          />
          <MetricCard
            icon={CheckCircle2}
            label="Good news on this day"
            tone="brand"
            value={metrics.daily.goodNews}
          />
        </div>
      </section>
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  tone = 'brand',
  value,
}: MetricCardProps) {
  return (
    <article className="grid min-h-28 gap-cluster rounded-panel border border-app-border bg-app-surface-muted p-panel">
      <div className="flex items-center justify-between gap-cluster">
        <span className="text-sm font-bold text-app-text-muted">{label}</span>
        <span className={getMetricIconClassName(tone)}>
          <Icon size={18} />
        </span>
      </div>
      <strong className="text-3xl font-bold leading-none text-app-text">
        {value}
      </strong>
    </article>
  );
}

function getAnalyticsMetrics(
  applications: ApplicationResponse[],
  selectedDate: string,
): AnalyticsMetrics {
  return {
    daily: {
      applied: countApplicationsCreatedOnDate(applications, selectedDate),
      goodNews: countApplicationsWithGoodNewsOnDate(applications, selectedDate),
      rejected: countApplicationsWithStatusChangeOnDate(
        applications,
        'rejected',
        selectedDate,
      ),
    },
    inProcess: applications.filter(isInProcessApplication).length,
    rejected: applications.filter((application) => application.status === 'rejected')
      .length,
    totalApplied: applications.length,
    waitingReply: applications.filter(
      (application) => application.status === 'applied',
    ).length,
  };
}

function countApplicationsCreatedOnDate(
  applications: ApplicationResponse[],
  selectedDate: string,
): number {
  if (!selectedDate) {
    return 0;
  }

  return applications.filter(
    (application) => toLocalDateInputValue(application.createdAt) === selectedDate,
  ).length;
}

function countApplicationsWithStatusChangeOnDate(
  applications: ApplicationResponse[],
  status: ApplicationStatus,
  selectedDate: string,
): number {
  if (!selectedDate) {
    return 0;
  }

  return applications.filter((application) =>
    application.statusHistory.some(
      (entry) =>
        entry.status === status &&
        toLocalDateInputValue(entry.changedAt) === selectedDate,
    ),
  ).length;
}

function countApplicationsWithGoodNewsOnDate(
  applications: ApplicationResponse[],
  selectedDate: string,
): number {
  if (!selectedDate) {
    return 0;
  }

  return applications.filter((application) =>
    application.statusHistory.some(
      (entry) =>
        entry.status !== 'applied' &&
        entry.status !== 'rejected' &&
        toLocalDateInputValue(entry.changedAt) === selectedDate,
    ),
  ).length;
}

function isInProcessApplication(application: ApplicationResponse): boolean {
  return application.status !== 'applied' && application.status !== 'rejected';
}

function toLocalDateInputValue(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getMetricIconClassName(tone: MetricCardProps['tone']): string {
  const baseClassName =
    'inline-flex size-9 shrink-0 items-center justify-center rounded-control';

  if (tone === 'accent') {
    return `${baseClassName} bg-accent-50 text-accent-700`;
  }

  if (tone === 'danger') {
    return `${baseClassName} bg-danger-100 text-danger-700`;
  }

  if (tone === 'warning') {
    return `${baseClassName} bg-warning-50 text-warning-700`;
  }

  return `${baseClassName} bg-brand-100 text-brand-700`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error';
}
