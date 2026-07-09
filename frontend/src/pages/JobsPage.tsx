import {
  CheckCircle,
  Download,
  Edit3,
  ExternalLink,
  Mail,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Wand2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { DataTable } from '../components/DataTable';
import type { DataTableColumn } from '../components/DataTable';
import { Drawer } from '../components/Drawer';
import { ErrorState } from '../components/ErrorState';
import { Textarea, TextInput } from '../components/Field';
import { LoadingState } from '../components/LoadingState';
import { StatusBadge } from '../components/StatusBadge';
import { apiBlob, apiRequest } from '../lib/api';
import {
  ApplicationResponse,
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

type DraftResponse = {
  draftMarkdown: string;
};

export function JobsPage() {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<JobResponse | null>(null);
  const [coverLetterJob, setCoverLetterJob] = useState<JobResponse | null>(null);

  const draftJobs = useMemo(
    () => jobs.filter((job) => job.status === 'draft'),
    [jobs],
  );
  const activeJobs = useMemo(
    () => jobs.filter((job) => job.status === 'active'),
    [jobs],
  );
  const appliedJobs = useMemo(
    () => jobs.filter((job) => job.status === 'applied'),
    [jobs],
  );

  useEffect(() => {
    void loadJobs();
  }, []);

  async function loadJobs() {
    setIsLoading(true);
    setError(null);

    try {
      setJobs(await apiRequest<JobResponse[]>('/jobs'));
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  }

  async function keepDraft(job: JobResponse) {
    await mutateJob(() =>
      apiRequest<JobResponse>(`/jobs/${job.id}/keep`, { method: 'POST' }),
    );
  }

  async function deleteDraft(job: JobResponse) {
    await mutateJob(() =>
      apiRequest<{ deleted: true }>(`/jobs/${job.id}`, { method: 'DELETE' }),
    );
  }

  async function markApplied(job: JobResponse) {
    await mutateJob(() =>
      apiRequest<ApplicationResponse>(`/jobs/${job.id}/apply`, {
        method: 'POST',
      }),
    );
  }

  async function mutateJob(action: () => Promise<unknown>) {
    setError(null);

    try {
      await action();
      await loadJobs();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    }
  }

  const draftColumns: Array<DataTableColumn<JobResponse>> = [
    {
      header: 'Job',
      render: (job) => <JobTitleCell job={job} />,
    },
    {
      header: 'Possible Duplicate',
      render: (job) => job.metadata?.possibleDuplicatedJobId ?? '—',
    },
    {
      header: 'Actions',
      render: (job) => (
        <div className="table-actions">
          <Button
            aria-label="Keep draft"
            className="icon-button"
            icon={<ShieldCheck size={15} />}
            onClick={() => keepDraft(job)}
          />
          <Button
            aria-label="Delete draft"
            className="icon-button"
            icon={<Trash2 size={15} />}
            onClick={() => deleteDraft(job)}
            variant="danger"
          />
        </div>
      ),
    },
  ];

  const activeColumns: Array<DataTableColumn<JobResponse>> = [
    {
      header: 'Job',
      render: (job) => <JobTitleCell job={job} />,
    },
    {
      header: 'Source',
      render: (job) => getSourceLabel(job.sourcePlatformId),
    },
    {
      header: 'Location',
      render: (job) => job.location ?? '—',
    },
    {
      header: 'Work',
      render: (job) => job.workModel ?? '—',
    },
    {
      header: 'Match',
      render: (job) => job.matchingScore ?? '—',
    },
    {
      header: 'Actions',
      render: (job) => (
        <div className="table-actions">
          <Button
            aria-label="Edit job"
            className="icon-button"
            icon={<Edit3 size={15} />}
            onClick={() => setEditingJob(job)}
          />
          <Button
            aria-label="Create cover letter"
            className="icon-button"
            icon={<Mail size={15} />}
            onClick={() => setCoverLetterJob(job)}
          />
          <Button
            aria-label="Mark as applied"
            className="icon-button"
            icon={<CheckCircle size={15} />}
            onClick={() => markApplied(job)}
            variant="primary"
          />
        </div>
      ),
    },
  ];

  const appliedColumns: Array<DataTableColumn<JobResponse>> = [
    {
      header: 'Job',
      render: (job) => <JobTitleCell job={job} />,
    },
    {
      header: 'Status',
      render: (job) => <StatusBadge status={job.status} />,
    },
    {
      header: 'Actions',
      render: (job) => (
        <div className="table-actions">
          <Button
            aria-label="Edit job"
            className="icon-button"
            icon={<Edit3 size={15} />}
            onClick={() => setEditingJob(job)}
          />
        </div>
      ),
    },
  ];

  return (
    <section className="page-stack">
      <div className="page-heading">
        <h1>Jobs</h1>
        <Button icon={<RefreshCw size={16} />} onClick={loadJobs}>
          Refresh
        </Button>
      </div>
      {error ? <ErrorState message={error} /> : null}
      {isLoading ? <LoadingState label="Loading jobs" /> : null}
      <section className="panel section-stack">
        <h2>Draft Jobs</h2>
        <DataTable
          columns={draftColumns}
          emptyLabel="No draft jobs."
          getRowKey={(job) => job.id}
          rows={draftJobs}
        />
      </section>
      <section className="panel section-stack">
        <h2>Active Jobs</h2>
        <DataTable
          columns={activeColumns}
          emptyLabel="No active jobs."
          getRowKey={(job) => job.id}
          rows={activeJobs}
        />
      </section>
      <section className="panel section-stack">
        <h2>Applied Jobs</h2>
        <DataTable
          columns={appliedColumns}
          emptyLabel="No applied jobs."
          getRowKey={(job) => job.id}
          rows={appliedJobs}
        />
      </section>
      <JobEditDrawer
        job={editingJob}
        onClose={() => setEditingJob(null)}
        onSaved={async () => {
          setEditingJob(null);
          await loadJobs();
        }}
      />
      <CoverLetterDrawer
        job={coverLetterJob}
        onClose={() => setCoverLetterJob(null)}
      />
    </section>
  );
}

function JobTitleCell({ job }: { job: JobResponse }) {
  return (
    <div className="job-title-cell">
      <strong>{job.title}</strong>
      <span>{job.companyName}</span>
      <a href={job.applicationUrl} rel="noreferrer" target="_blank">
        <ExternalLink size={13} />
        Open
      </a>
    </div>
  );
}

function JobEditDrawer({
  job,
  onClose,
  onSaved,
}: {
  job: JobResponse | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<JobFormState>(() => toJobFormState(job));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(toJobFormState(job));
    setError(null);
  }, [job]);

  async function saveJob() {
    if (!job) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await apiRequest<JobResponse>(`/jobs/${job.id}`, {
        body: JSON.stringify(toJobPatch(form)),
        method: 'PATCH',
      });
      await onSaved();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Drawer onClose={onClose} open={!!job} title="Job Details">
      {error ? <ErrorState message={error} /> : null}
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
              setForm({
                ...form,
                workModel: event.target.value as WorkModel,
              })
            }
            value={form.workModel ?? 'hybrid'}
          >
            {WORK_MODEL_OPTIONS.map((workModel) => (
              <option key={workModel.id} value={workModel.id}>
                {workModel.label}
              </option>
            ))}
          </select>
        </label>
        <TextInput
          label="Salary"
          onChange={(event) =>
            setForm({ ...form, salaryText: event.target.value })
          }
          value={form.salaryText ?? ''}
        />
        <TextInput
          label="Tech stack"
          onChange={(event) => setForm({ ...form, techStack: event.target.value })}
          value={form.techStack}
        />
        <TextInput
          label="Matching score"
          onChange={(event) =>
            setForm({ ...form, matchingScore: event.target.value })
          }
          type="number"
          value={form.matchingScore}
        />
        <TextInput
          label="Posted at"
          onChange={(event) => setForm({ ...form, postedAt: event.target.value })}
          value={form.postedAt ?? ''}
        />
        <TextInput
          label="Apply deadline"
          onChange={(event) =>
            setForm({ ...form, applyDeadline: event.target.value })
          }
          value={form.applyDeadline ?? ''}
        />
        <TextInput
          label="Contact"
          onChange={(event) =>
            setForm({ ...form, contactInfo: event.target.value })
          }
          value={form.contactInfo ?? ''}
        />
      </div>
      <div className="drawer-section">
        <Textarea
          label="Description"
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
          rows={8}
          value={form.description}
        />
        <Textarea
          label="Matching reason"
          onChange={(event) =>
            setForm({ ...form, matchingReason: event.target.value })
          }
          rows={4}
          value={form.matchingReason ?? ''}
        />
        <Textarea
          label="Raw text"
          onChange={(event) => setForm({ ...form, rawText: event.target.value })}
          rows={5}
          value={form.rawText ?? ''}
        />
      </div>
      <div className="drawer-actions">
        <Button disabled={isSaving} onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={isSaving} onClick={saveJob} variant="primary">
          {isSaving ? 'Saving' : 'Save'}
        </Button>
      </div>
    </Drawer>
  );
}

function CoverLetterDrawer({
  job,
  onClose,
}: {
  job: JobResponse | null;
  onClose: () => void;
}) {
  const [instructions, setInstructions] = useState('');
  const [revisionInstructions, setRevisionInstructions] = useState('');
  const [draftMarkdown, setDraftMarkdown] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setInstructions('');
    setRevisionInstructions('');
    setDraftMarkdown('');
    setError(null);
    setMessage(null);
  }, [job]);

  async function generateDraft() {
    if (!job) {
      return;
    }

    setIsGenerating(true);
    setError(null);
    setMessage(null);

    try {
      const result = await apiRequest<DraftResponse>('/cover-letters/draft', {
        body: JSON.stringify({
          jobId: job.id,
          userInstructions: instructions || undefined,
        }),
        method: 'POST',
      });

      setDraftMarkdown(result.draftMarkdown);
      setRevisionInstructions('');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsGenerating(false);
    }
  }

  async function reviseDraft() {
    if (!job || !draftMarkdown || !revisionInstructions.trim()) {
      return;
    }

    setIsRevising(true);
    setError(null);
    setMessage(null);

    try {
      const result = await apiRequest<DraftResponse>('/cover-letters/revise', {
        body: JSON.stringify({
          jobId: job.id,
          currentDraftMarkdown: draftMarkdown,
          revisionInstructions,
        }),
        method: 'POST',
      });

      setDraftMarkdown(result.draftMarkdown);
      setRevisionInstructions('');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsRevising(false);
    }
  }

  async function downloadPdf() {
    if (!job || !draftMarkdown) {
      return;
    }

    setIsDownloading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await apiBlob('/cover-letters/pdf', {
        body: JSON.stringify({
          jobId: job.id,
          finalDraftMarkdown: draftMarkdown,
        }),
        method: 'POST',
      });

      downloadBlob(result.blob, result.filename);
      setMessage('PDF downloaded');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Drawer
      onClose={onClose}
      open={!!job}
      title={job ? `Cover Letter - ${job.companyName}` : 'Cover Letter'}
    >
      {error ? <ErrorState message={error} /> : null}
      {message ? <div className="success-line">{message}</div> : null}
      <div className="drawer-section">
        <Textarea
          label="Instructions"
          onChange={(event) => setInstructions(event.target.value)}
          rows={4}
          value={instructions}
        />
        <Button
          disabled={isGenerating}
          icon={<Mail size={16} />}
          onClick={generateDraft}
          variant="primary"
        >
          {isGenerating ? 'Generating' : 'Generate Draft'}
        </Button>
        <Textarea
          label="Draft"
          readOnly
          rows={14}
          value={draftMarkdown}
        />
        <Textarea
          label="Revision instructions"
          onChange={(event) => setRevisionInstructions(event.target.value)}
          rows={4}
          value={revisionInstructions}
        />
        <div className="drawer-actions">
          <Button
            disabled={
              isRevising ||
              !draftMarkdown ||
              revisionInstructions.trim().length === 0
            }
            icon={<Wand2 size={16} />}
            onClick={reviseDraft}
          >
            {isRevising ? 'Revising' : 'Revise'}
          </Button>
          <Button
            disabled={isDownloading || !draftMarkdown}
            icon={<Download size={16} />}
            onClick={downloadPdf}
            variant="primary"
          >
            {isDownloading ? 'Preparing' : 'Download PDF'}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

function toJobFormState(job: JobResponse | null): JobFormState {
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

function getSourceLabel(sourcePlatformId: SourcePlatformId): string {
  return (
    SOURCE_PLATFORMS.find((platform) => platform.id === sourcePlatformId)
      ?.label ?? sourcePlatformId
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error';
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
