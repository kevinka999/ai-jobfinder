import { PanelRightOpen, RefreshCw, Save, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button';
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
  const [jobFilter, setJobFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    () => filterApplicationsByJob(applications, jobFilter),
    [applications, jobFilter],
  );

  const columns: Array<DataTableColumn<ApplicationResponse>> = [
    {
      header: 'Open',
      id: 'open',
      render: (application) =>
        application.job ? <JobOpenLink job={application.job} /> : '—',
    },
    {
      header: 'Job',
      id: 'job',
      render: (application) =>
        application.job ? (
          <JobTitleCell job={application.job} />
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
      header: 'Applied',
      render: (application) => formatDate(application.createdAt),
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
        <label className="grid max-w-md gap-1.5">
          <span className={fieldLabelClassName}>Filter by job</span>
          <span className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-app-text-muted"
              size={15}
            />
            <input
              className={`${inputClassName} pl-8`}
              onChange={(event) => setJobFilter(event.target.value)}
              placeholder="Job title or company"
              type="search"
              value={jobFilter}
            />
          </span>
        </label>
        <DataTable
          columns={columns}
          emptyLabel={
            jobFilter.trim() ? 'No applications match this job filter.' : 'No applications.'
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

    setIsSavingApplication(true);

    try {
      const updatedApplication = await apiRequest<ApplicationResponse>(
        `/applications/${application.id}`,
        {
          body: JSON.stringify({ status, notes }),
          method: 'PATCH',
        },
      );

      await onSaved(updatedApplication);
      toast.success('Application saved');
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

function getApplicationJobSortLabel(application: ApplicationResponse): string {
  if (!application.job) {
    return application.jobId;
  }

  return `${application.job.companyName} ${application.job.title}`;
}

function filterApplicationsByJob(
  applications: ApplicationResponse[],
  jobFilter: string,
) {
  const normalizedFilter = normalizeFilterText(jobFilter);

  if (!normalizedFilter) {
    return applications;
  }

  return applications.filter((application) =>
    normalizeFilterText(getApplicationJobSortLabel(application)).includes(
      normalizedFilter,
    ),
  );
}

function normalizeFilterText(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error';
}
