import {
  CalendarCheck,
  PanelRightOpen,
  RefreshCw,
  Save,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { CheckboxMenu } from '../components/CheckboxMenu';
import {
  CompanyHistoryBadge,
  CompanyHistoryDrawer,
} from '../components/CompanyHistory';
import { DataTable } from '../components/DataTable';
import type { DataTableColumn } from '../components/DataTable';
import { Drawer } from '../components/Drawer';
import { ErrorState } from '../components/ErrorState';
import { useToast } from '../components/toastContext';
import {
  fieldClassName,
  fieldLabelClassName,
  inputClassName,
  Textarea,
  TextInput,
} from '../components/Field';
import { JobOpenLink } from '../components/JobOpenLink';
import { JobFavoriteButton } from '../components/JobFavoriteButton';
import { JobTitleCell } from '../components/JobTitleCell';
import { LoadingState } from '../components/LoadingState';
import { StatusBadge } from '../components/StatusBadge';
import {
  dividedDrawerSectionClass,
  drawerActionsClass,
  drawerSectionClass,
  editFormGridClass,
  pageHeadingClass,
  pageStackClass,
  pageTitleClass,
  panelSectionClass,
  tableActionsClass,
} from '../design/classes';
import { apiRequest } from '../lib/api';
import {
  APPLICATION_STATUS_OPTIONS,
  ApplicationResponse,
  ApplicationStatus,
  CompanyApplicationHistoryResponse,
  JobEditableFields,
  JobResponse,
  SOURCE_PLATFORMS,
  SourcePlatformId,
  WORK_MODEL_OPTIONS,
  WorkModel,
} from '../lib/types';

type JobFormState = Omit<JobEditableFields, 'techStack' | 'matchingScore'> & {
  matchingScore: string;
  techStack: string;
};

export function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [selectedApplication, setSelectedApplication] =
    useState<ApplicationResponse | null>(null);
  const [companyHistoryByJobId, setCompanyHistoryByJobId] = useState<
    Record<string, CompanyApplicationHistoryResponse>
  >({});
  const [selectedCompanyHistoryJobId, setSelectedCompanyHistoryJobId] =
    useState<string | null>(null);
  const [isCompanyHistoryLoading, setIsCompanyHistoryLoading] = useState(false);
  const [jobFilter, setJobFilter] = useState('');
  const [appliedDateFilter, setAppliedDateFilter] = useState('');
  const [statusFilters, setStatusFilters] = useState<ApplicationStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutatingApplication, setMutatingApplication] = useState<{
    id: string;
    status: ApplicationStatus;
  } | null>(null);
  const [mutatingFavoriteJobId, setMutatingFavoriteJobId] = useState<
    string | null
  >(null);
  const toast = useToast();

  const loadApplications = useCallback(async (showSuccessToast = false) => {
    setIsLoading(true);
    setError(null);

    try {
      setApplications(await apiRequest<ApplicationResponse[]>('/applications'));
      if (showSuccessToast) {
        toast.success('Applications refreshed');
      }
    } catch (caughtError) {
      const message = getErrorMessage(caughtError);
      setError(message);
      toast.error(`Could not load applications: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const filteredApplications = useMemo(
    () =>
      filterApplications(applications, {
        appliedDateFilter,
        jobFilter,
        statusFilters,
      }),
    [applications, appliedDateFilter, jobFilter, statusFilters],
  );
  const hasActiveFilters =
    !!jobFilter.trim() || !!appliedDateFilter || statusFilters.length > 0;
  const selectedCompanyHistory = selectedCompanyHistoryJobId
    ? companyHistoryByJobId[selectedCompanyHistoryJobId] ?? null
    : null;

  useEffect(() => {
    let ignore = false;

    async function loadCompanyHistory() {
      const jobIds = Array.from(
        new Set(
          applications
            .map((application) => application.job?.id)
            .filter((jobId): jobId is string => jobId !== undefined),
        ),
      );

      if (jobIds.length === 0) {
        setCompanyHistoryByJobId({});
        setIsCompanyHistoryLoading(false);
        return;
      }

      setIsCompanyHistoryLoading(true);

      try {
        const histories = await apiRequest<CompanyApplicationHistoryResponse[]>(
          '/applications/company-history',
          {
            body: JSON.stringify({ jobIds }),
            method: 'POST',
          },
        );

        if (!ignore) {
          setCompanyHistoryByJobId(toCompanyHistoryMap(histories));
        }
      } catch (caughtError) {
        if (!ignore) {
          setCompanyHistoryByJobId({});
          toast.error(
            `Could not load company applications: ${getErrorMessage(caughtError)}`,
          );
        }
      } finally {
        if (!ignore) {
          setIsCompanyHistoryLoading(false);
        }
      }
    }

    void loadCompanyHistory();

    return () => {
      ignore = true;
    };
  }, [applications, toast]);

  async function moveApplicationStatus(
    application: ApplicationResponse,
    nextStatus: ApplicationStatus,
  ) {
    setMutatingApplication({ id: application.id, status: nextStatus });

    try {
      const updatedApplication = await apiRequest<ApplicationResponse>(
        `/applications/${application.id}`,
        {
          body: JSON.stringify({ status: nextStatus }),
          method: 'PATCH',
        },
      );

      setApplications((currentApplications) =>
        currentApplications.map((currentApplication) =>
          currentApplication.id === updatedApplication.id
            ? updatedApplication
            : currentApplication,
        ),
      );
      setSelectedApplication((currentApplication) =>
        currentApplication?.id === updatedApplication.id
          ? updatedApplication
          : currentApplication,
      );
      toast.success(
        nextStatus === 'interviewing'
          ? 'Moved to interviewing'
          : 'Application rejected',
      );
    } catch (caughtError) {
      toast.error(`Could not update application: ${getErrorMessage(caughtError)}`);
    } finally {
      setMutatingApplication(null);
    }
  }

  async function toggleJobFavorite(job: JobResponse) {
    setMutatingFavoriteJobId(job.id);

    try {
      const updatedJob = await apiRequest<JobResponse>(
        `/jobs/${job.id}/favorite`,
        {
          body: JSON.stringify({ isFavorite: !job.isFavorite }),
          method: 'PATCH',
        },
      );

      setApplications((currentApplications) =>
        currentApplications.map((application) =>
          updateApplicationJob(application, updatedJob),
        ),
      );
      setSelectedApplication((currentApplication) =>
        currentApplication
          ? updateApplicationJob(currentApplication, updatedJob)
          : currentApplication,
      );
      toast.success(updatedJob.isFavorite ? 'Job favorited' : 'Job unfavorited');
    } catch (caughtError) {
      toast.error(`Could not update favorite: ${getErrorMessage(caughtError)}`);
    } finally {
      setMutatingFavoriteJobId(null);
    }
  }

  const columns: Array<DataTableColumn<ApplicationResponse>> = [
    {
      header: 'Open',
      id: 'open',
      render: (application) =>
        application.job ? <JobOpenLink job={application.job} /> : '—',
    },
    {
      header: 'Favorite',
      id: 'favorite',
      render: (application) =>
        application.job ? (
          <JobFavoriteButton
            isLoading={mutatingFavoriteJobId === application.job.id}
            job={application.job}
            onToggle={toggleJobFavorite}
          />
        ) : (
          '—'
        ),
      sortValue: getApplicationFavoriteSortValue,
    },
    {
      header: 'Job',
      id: 'job',
      render: (application) =>
        application.job ? (
          <JobTitleCell
            companyMeta={
              <CompanyHistoryBadge
                history={companyHistoryByJobId[application.job.id]}
                isLoading={isCompanyHistoryLoading}
                onOpen={(history) =>
                  setSelectedCompanyHistoryJobId(history.jobId)
                }
              />
            }
            job={application.job}
          />
        ) : (
          application.jobId
        ),
      sortValue: getApplicationJobSortLabel,
    },
    {
      header: 'Status',
      render: (application) => <StatusBadge status={application.status} />,
      sortValue: (application) => application.status,
    },
    {
      defaultSortDirection: 'desc',
      header: 'Inserted',
      id: 'inserted',
      render: (application) => formatShortDate(application.createdAt),
      sortValue: (application) => new Date(application.createdAt),
    },
    {
      header: 'Actions',
      render: (application) => (
        <div className={tableActionsClass}>
          <Button
            aria-label="Open application"
            icon={<PanelRightOpen size={15} />}
            onClick={() => setSelectedApplication(application)}
          />
          {application.status === 'applied' ? (
            <>
              <Button
                aria-label="Move application to interview"
                disabled={mutatingApplication?.id === application.id}
                icon={<CalendarCheck size={15} />}
                isLoading={
                  mutatingApplication?.id === application.id &&
                  mutatingApplication.status === 'interviewing'
                }
                onClick={() => moveApplicationStatus(application, 'interviewing')}
                title="Move to interview"
                variant="primary"
              />
              <Button
                aria-label="Move application to rejected"
                disabled={mutatingApplication?.id === application.id}
                icon={<XCircle size={15} />}
                isLoading={
                  mutatingApplication?.id === application.id &&
                  mutatingApplication.status === 'rejected'
                }
                onClick={() => moveApplicationStatus(application, 'rejected')}
                title="Move to rejected"
                variant="danger"
              />
            </>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <section className={pageStackClass}>
      <div className={pageHeadingClass}>
        <h1 className={pageTitleClass}>Applications</h1>
        <Button
          icon={<RefreshCw size={16} />}
          isLoading={isLoading}
          onClick={() => loadApplications(true)}
        >
          Refresh
        </Button>
      </div>
      {error ? <ErrorState message={error} /> : null}
      {isLoading ? <LoadingState label="Loading applications" /> : null}
      <section className={panelSectionClass}>
        <div className="grid gap-cluster lg:grid-cols-[minmax(220px,1fr)_minmax(180px,220px)_minmax(260px,1.2fr)]">
          <label className="grid gap-1.5">
            <span className={fieldLabelClassName}>Filter by job</span>
            <input
              className={inputClassName}
              onChange={(event) => setJobFilter(event.target.value)}
              placeholder="Job title or company"
              type="search"
              value={jobFilter}
            />
          </label>
          <div className={fieldClassName}>
            <span className={fieldLabelClassName}>Inserted date</span>
            <input
              className={inputClassName}
              onChange={(event) => setAppliedDateFilter(event.target.value)}
              type="date"
              value={appliedDateFilter}
            />
          </div>
          <CheckboxMenu
            emptyLabel="All statuses"
            label="Status"
            menuLabel="Application status filters"
            onChange={setStatusFilters}
            options={APPLICATION_STATUS_OPTIONS}
            selected={statusFilters}
            selectedLabel={getStatusFilterLabel}
          />
        </div>
        {hasActiveFilters ? (
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setJobFilter('');
                setAppliedDateFilter('');
                setStatusFilters([]);
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : null}
        <DataTable
          columns={columns}
          emptyLabel={
            hasActiveFilters
              ? 'No applications match these filters.'
              : 'No applications.'
          }
          getRowKey={(application) => application.id}
          rows={filteredApplications}
        />
      </section>
      <ApplicationDrawer
        application={selectedApplication}
        onClose={() => setSelectedApplication(null)}
        onSaved={async (updatedApplication) => {
          setSelectedApplication(updatedApplication);
          await loadApplications();
        }}
      />
      <CompanyHistoryDrawer
        history={selectedCompanyHistory}
        onClose={() => setSelectedCompanyHistoryJobId(null)}
      />
    </section>
  );
}

function ApplicationDrawer({
  application,
  onClose,
  onSaved,
}: {
  application: ApplicationResponse | null;
  onClose: () => void;
  onSaved: (application: ApplicationResponse) => Promise<void>;
}) {
  const [status, setStatus] = useState<ApplicationStatus>('applied');
  const [notes, setNotes] = useState('');
  const [jobForm, setJobForm] = useState<JobFormState>(() =>
    toJobFormState(application?.job),
  );
  const [isSavingApplication, setIsSavingApplication] = useState(false);
  const [isSavingJob, setIsSavingJob] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setStatus(application?.status ?? 'applied');
    setNotes(application?.notes ?? '');
    setJobForm(toJobFormState(application?.job));
  }, [application]);

  async function saveApplication() {
    if (!application) {
      return;
    }

    await updateApplication(status, 'Application saved');
  }

  async function updateApplication(
    nextStatus: ApplicationStatus,
    successMessage: string,
  ) {
    if (!application) {
      return;
    }

    setIsSavingApplication(true);

    try {
      const updatedApplication = await apiRequest<ApplicationResponse>(
        `/applications/${application.id}`,
        {
          body: JSON.stringify({ status: nextStatus, notes }),
          method: 'PATCH',
        },
      );

      await onSaved(updatedApplication);
      toast.success(successMessage);
    } catch (caughtError) {
      toast.error(`Could not save application: ${getErrorMessage(caughtError)}`);
    } finally {
      setIsSavingApplication(false);
    }
  }

  async function saveJob() {
    if (!application?.job) {
      return;
    }

    setIsSavingJob(true);

    try {
      await apiRequest<JobResponse>(`/jobs/${application.job.id}`, {
        body: JSON.stringify(toJobPatch(jobForm)),
        method: 'PATCH',
      });
      const updatedApplication = await apiRequest<ApplicationResponse>(
        `/applications/${application.id}`,
      );

      await onSaved(updatedApplication);
      toast.success('Job saved');
    } catch (caughtError) {
      toast.error(`Could not save job: ${getErrorMessage(caughtError)}`);
    } finally {
      setIsSavingJob(false);
    }
  }

  return (
    <Drawer
      onClose={onClose}
      open={!!application}
      title={application?.job?.companyName ?? 'Application'}
    >
      <div className={drawerSectionClass}>
        <h3 className="m-0 text-[15px] font-bold text-app-text">Application</h3>
        <label className={fieldClassName}>
          <span className={fieldLabelClassName}>Application status</span>
          <select
            className={inputClassName}
            onChange={(event) =>
              setStatus(event.target.value as ApplicationStatus)
            }
            value={status}
          >
            {APPLICATION_STATUS_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <Textarea
          label="Application notes"
          onChange={(event) => setNotes(event.target.value)}
          rows={5}
          value={notes}
        />
        <div className={drawerActionsClass}>
          <Button
            disabled={isSavingApplication}
            icon={<Save size={16} />}
            isLoading={isSavingApplication}
            onClick={saveApplication}
            variant="primary"
          >
            Save Application
          </Button>
        </div>
      </div>
      {application?.job ? (
        <>
          <div className={dividedDrawerSectionClass}>
            <h3 className="m-0 text-[15px] font-bold text-app-text">
              Job Details
            </h3>
            <JobDetailsForm form={jobForm} setForm={setJobForm} />
            <div className={drawerActionsClass}>
              <Button
                disabled={isSavingJob}
                icon={<Save size={16} />}
                isLoading={isSavingJob}
                onClick={saveJob}
                variant="primary"
              >
                Save Job
              </Button>
            </div>
          </div>
          <div className={dividedDrawerSectionClass}>
            <h3 className="m-0 text-[15px] font-bold text-app-text">
              Status History
            </h3>
            <div className="grid gap-inline">
              {application.statusHistory.map((entry) => (
                <div
                  className="flex items-center justify-between gap-cluster rounded-panel border border-app-border px-2.5 py-2"
                  key={`${entry.status}-${entry.changedAt}`}
                >
                  <StatusBadge status={entry.status} />
                  <span className="text-xs font-bold text-app-text-muted">
                    {formatDate(entry.changedAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </Drawer>
  );
}

function JobDetailsForm({
  form,
  setForm,
}: {
  form: JobFormState;
  setForm: (form: JobFormState) => void;
}) {
  return (
    <>
      <div className={editFormGridClass}>
        <TextInput
          label="Company"
          onChange={(event) =>
            setForm({ ...form, companyName: event.target.value })
          }
          value={form.companyName}
        />
        <TextInput
          label="Title"
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          value={form.title}
        />
        <TextInput
          label="Application URL"
          onChange={(event) =>
            setForm({ ...form, applicationUrl: event.target.value })
          }
          value={form.applicationUrl}
        />
        <label className={fieldClassName}>
          <span className={fieldLabelClassName}>Source platform</span>
          <select
            className={inputClassName}
            onChange={(event) =>
              setForm({
                ...form,
                sourcePlatformId: event.target.value as SourcePlatformId,
              })
            }
            value={form.sourcePlatformId}
          >
            {SOURCE_PLATFORMS.map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.label}
              </option>
            ))}
          </select>
        </label>
        <TextInput
          label="Location"
          onChange={(event) => setForm({ ...form, location: event.target.value })}
          value={form.location ?? ''}
        />
        <label className={fieldClassName}>
          <span className={fieldLabelClassName}>Work model</span>
          <select
            className={inputClassName}
            onChange={(event) =>
              setForm({ ...form, workModel: event.target.value as WorkModel })
            }
            value={form.workModel ?? 'hybrid'}
          >
            {WORK_MODEL_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={drawerSectionClass}>
        <Textarea
          label="Description"
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
          rows={7}
          value={form.description}
        />
        <Textarea
          label="Raw text"
          onChange={(event) => setForm({ ...form, rawText: event.target.value })}
          rows={4}
          value={form.rawText ?? ''}
        />
      </div>
    </>
  );
}

function toJobFormState(job: JobResponse | undefined): JobFormState {
  return {
    companyName: job?.companyName ?? '',
    title: job?.title ?? '',
    applicationUrl: job?.applicationUrl ?? '',
    description: job?.description ?? '',
    sourcePlatformId: job?.sourcePlatformId ?? 'linkedin',
    location: job?.location ?? '',
    workModel: job?.workModel ?? 'hybrid',
    salaryText: job?.salaryText ?? '',
    techStack: job?.techStack?.join(', ') ?? '',
    matchingScore: job?.matchingScore?.toString() ?? '',
    matchingReason: job?.matchingReason ?? '',
    postedAt: toDateInputValue(job?.postedAt),
    applyDeadline: toDateInputValue(job?.applyDeadline),
    contactInfo: job?.contactInfo ?? '',
    rawText: job?.rawText ?? '',
  };
}

function toJobPatch(form: JobFormState): Partial<JobEditableFields> {
  const techStack = form.techStack
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    ...form,
    applyDeadline: form.applyDeadline || undefined,
    matchingScore: form.matchingScore
      ? Number.parseFloat(form.matchingScore)
      : undefined,
    postedAt: form.postedAt || undefined,
    techStack: techStack.length > 0 ? techStack : undefined,
  };
}

function toDateInputValue(value?: string): string {
  return value?.slice(0, 10) ?? '';
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function getApplicationJobSortLabel(application: ApplicationResponse): string {
  if (!application.job) {
    return application.jobId;
  }

  return `${application.job.companyName} ${application.job.title}`;
}

function getApplicationFavoriteSortValue(
  application: ApplicationResponse,
): number | undefined {
  if (!application.job) {
    return undefined;
  }

  return application.job.isFavorite ? 0 : 1;
}

function updateApplicationJob(
  application: ApplicationResponse,
  updatedJob: JobResponse,
): ApplicationResponse {
  if (application.job?.id !== updatedJob.id) {
    return application;
  }

  return { ...application, job: updatedJob };
}

function toCompanyHistoryMap(
  histories: CompanyApplicationHistoryResponse[],
): Record<string, CompanyApplicationHistoryResponse> {
  return Object.fromEntries(
    histories.map((history) => [history.jobId, history]),
  );
}

function filterApplications(
  applications: ApplicationResponse[],
  {
    appliedDateFilter,
    jobFilter,
    statusFilters,
  }: {
    appliedDateFilter: string;
    jobFilter: string;
    statusFilters: ApplicationStatus[];
  },
) {
  const normalizedFilter = normalizeFilterText(jobFilter);

  return applications.filter((application) =>
    matchesJobFilter(application, normalizedFilter) &&
    matchesAppliedDateFilter(application, appliedDateFilter) &&
    matchesStatusFilters(application, statusFilters),
  );
}

function matchesJobFilter(
  application: ApplicationResponse,
  normalizedFilter: string,
): boolean {
  if (!normalizedFilter) {
    return true;
  }

  return normalizeFilterText(getApplicationJobSortLabel(application)).includes(
    normalizedFilter,
  );
}

function matchesAppliedDateFilter(
  application: ApplicationResponse,
  appliedDateFilter: string,
): boolean {
  if (!appliedDateFilter) {
    return true;
  }

  return toLocalDateInputValue(application.createdAt) === appliedDateFilter;
}

function matchesStatusFilters(
  application: ApplicationResponse,
  statusFilters: ApplicationStatus[],
): boolean {
  if (statusFilters.length === 0) {
    return true;
  }

  return statusFilters.includes(application.status);
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

function getStatusFilterLabel(selected: ApplicationStatus[]): string {
  if (selected.length === 0) {
    return 'All statuses';
  }

  if (selected.length === 1) {
    return getApplicationStatusLabel(selected[0]);
  }

  return `${selected.length} statuses`;
}

function getApplicationStatusLabel(status: ApplicationStatus): string {
  return (
    APPLICATION_STATUS_OPTIONS.find((option) => option.id === status)?.label ??
    status
  );
}

function normalizeFilterText(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error';
}
