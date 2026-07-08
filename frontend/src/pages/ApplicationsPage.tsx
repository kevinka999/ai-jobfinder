import { Edit3, ExternalLink, RefreshCw, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { DataTable } from '../components/DataTable';
import type { DataTableColumn } from '../components/DataTable';
import { Drawer } from '../components/Drawer';
import { ErrorState } from '../components/ErrorState';
import { Textarea, TextInput } from '../components/Field';
import { LoadingState } from '../components/LoadingState';
import { StatusBadge } from '../components/StatusBadge';
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadApplications();
  }, []);

  async function loadApplications() {
    setIsLoading(true);
    setError(null);

    try {
      setApplications(await apiRequest<ApplicationResponse[]>('/applications'));
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  }

  const columns: Array<DataTableColumn<ApplicationResponse>> = [
    {
      header: 'Job',
      render: (application) =>
        application.job ? (
          <div className="job-title-cell">
            <strong>{application.job.title}</strong>
            <span>{application.job.companyName}</span>
            <a
              href={application.job.applicationUrl}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink size={13} />
              Open
            </a>
          </div>
        ) : (
          application.jobId
        ),
    },
    {
      header: 'Status',
      render: (application) => <StatusBadge status={application.status} />,
    },
    {
      header: 'Applied',
      render: (application) => formatDate(application.createdAt),
    },
    {
      header: 'Updated',
      render: (application) => formatDate(application.updatedAt),
    },
    {
      header: 'Actions',
      render: (application) => (
        <Button
          icon={<Edit3 size={15} />}
          onClick={() => setSelectedApplication(application)}
        >
          Open
        </Button>
      ),
    },
  ];

  return (
    <section className="page-stack">
      <div className="page-heading">
        <h1>Applications</h1>
        <Button icon={<RefreshCw size={16} />} onClick={loadApplications}>
          Refresh
        </Button>
      </div>
      {error ? <ErrorState message={error} /> : null}
      {isLoading ? <LoadingState label="Loading applications" /> : null}
      <section className="panel section-stack">
        <DataTable
          columns={columns}
          emptyLabel="No applications."
          getRowKey={(application) => application.id}
          rows={applications}
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
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSavingApplication, setIsSavingApplication] = useState(false);
  const [isSavingJob, setIsSavingJob] = useState(false);

  useEffect(() => {
    setStatus(application?.status ?? 'applied');
    setNotes(application?.notes ?? '');
    setJobForm(toJobFormState(application?.job));
    setError(null);
    setMessage(null);
  }, [application]);

  async function saveApplication() {
    if (!application) {
      return;
    }

    setIsSavingApplication(true);
    setError(null);
    setMessage(null);

    try {
      const updatedApplication = await apiRequest<ApplicationResponse>(
        `/applications/${application.id}`,
        {
          body: JSON.stringify({ status, notes }),
          method: 'PATCH',
        },
      );

      setMessage('Application saved');
      await onSaved(updatedApplication);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsSavingApplication(false);
    }
  }

  async function saveJob() {
    if (!application?.job) {
      return;
    }

    setIsSavingJob(true);
    setError(null);
    setMessage(null);

    try {
      await apiRequest<JobResponse>(`/jobs/${application.job.id}`, {
        body: JSON.stringify(toJobPatch(jobForm)),
        method: 'PATCH',
      });
      const updatedApplication = await apiRequest<ApplicationResponse>(
        `/applications/${application.id}`,
      );

      setMessage('Job saved');
      await onSaved(updatedApplication);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
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
      {error ? <ErrorState message={error} /> : null}
      {message ? <div className="success-line">{message}</div> : null}
      <div className="edit-form-grid">
        <label className="field">
          <span>Application status</span>
          <select
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
      </div>
      <div className="drawer-actions">
        <Button
          disabled={isSavingApplication}
          icon={<Save size={16} />}
          onClick={saveApplication}
          variant="primary"
        >
          {isSavingApplication ? 'Saving' : 'Save Application'}
        </Button>
      </div>
      <div className="drawer-section">
        <h3>Status History</h3>
        <div className="history-list">
          {application?.statusHistory.map((entry) => (
            <div className="history-row" key={`${entry.status}-${entry.changedAt}`}>
              <StatusBadge status={entry.status} />
              <span>{formatDate(entry.changedAt)}</span>
            </div>
          ))}
        </div>
      </div>
      {application?.job ? (
        <>
          <div className="drawer-section">
            <h3>Job Details</h3>
            <JobDetailsForm form={jobForm} setForm={setJobForm} />
          </div>
          <div className="drawer-actions">
            <Button
              disabled={isSavingJob}
              icon={<Save size={16} />}
              onClick={saveJob}
              variant="primary"
            >
              {isSavingJob ? 'Saving' : 'Save Job'}
            </Button>
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
      <div className="edit-form-grid">
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
        <label className="field">
          <span>Source platform</span>
          <select
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
        <label className="field">
          <span>Work model</span>
          <select
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
      <div className="drawer-section">
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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error';
}
