import {
  CheckCircle,
  Download,
  Edit3,
  LoaderCircle,
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
import {
  fieldClassName,
  fieldLabelClassName,
  inputClassName,
  Textarea,
  TextInput,
} from '../components/Field';
import { JobTitleCell } from '../components/JobTitleCell';
import { LoadingState } from '../components/LoadingState';
import { Stepper } from '../components/Stepper';
import {
  drawerActionsClass,
  drawerSectionClass,
  editFormGridClass,
  pageHeadingClass,
  pageStackClass,
  pageTitleClass,
  panelSectionClass,
  panelTitleClass,
  successLineClass,
  tableActionsClass,
} from '../design/classes';
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

const COVER_LETTER_STEPS = [
  { id: 'instructions', label: 'Instructions' },
  { id: 'draft', label: 'Draft' },
  { id: 'pdf', label: 'PDF' },
];

type CoverLetterStep = 0 | 1 | 2;

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
        <div className={tableActionsClass}>
          <Button
            aria-label="Keep draft"
            icon={<ShieldCheck size={15} />}
            onClick={() => keepDraft(job)}
          />
          <Button
            aria-label="Delete draft"
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
        <div className={tableActionsClass}>
          <Button
            aria-label="Edit job"
            icon={<Edit3 size={15} />}
            onClick={() => setEditingJob(job)}
          />
          <Button
            aria-label="Create cover letter"
            icon={<Mail size={15} />}
            onClick={() => setCoverLetterJob(job)}
          />
          <Button
            aria-label="Mark as applied"
            icon={<CheckCircle size={15} />}
            onClick={() => markApplied(job)}
            variant="primary"
          />
        </div>
      ),
    },
  ];

  return (
    <section className={pageStackClass}>
      <div className={pageHeadingClass}>
        <h1 className={pageTitleClass}>Jobs</h1>
        <Button icon={<RefreshCw size={16} />} onClick={loadJobs}>
          Refresh
        </Button>
      </div>
      {error ? <ErrorState message={error} /> : null}
      {isLoading ? <LoadingState label="Loading jobs" /> : null}
      <section className={panelSectionClass}>
        <h2 className={panelTitleClass}>Draft Jobs</h2>
        <DataTable
          columns={draftColumns}
          emptyLabel="No draft jobs."
          getRowKey={(job) => job.id}
          rows={draftJobs}
        />
      </section>
      <section className={panelSectionClass}>
        <h2 className={panelTitleClass}>Active Jobs</h2>
        <DataTable
          columns={activeColumns}
          emptyLabel="No active jobs."
          getRowKey={(job) => job.id}
          rows={activeJobs}
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
      <div className={drawerSectionClass}>
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
      <div className={drawerActionsClass}>
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
  const [currentStep, setCurrentStep] = useState<CoverLetterStep>(0);
  const [instructions, setInstructions] = useState('');
  const [revisionInstructions, setRevisionInstructions] = useState('');
  const [draftMarkdown, setDraftMarkdown] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setCurrentStep(0);
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
      setCurrentStep(1);
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

      downloadBlob(result.blob, toCoverLetterPdfFilename(job.companyName));
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
      <div className="grid gap-cluster">
        <Stepper currentStep={currentStep} steps={COVER_LETTER_STEPS} />
        {error ? <ErrorState message={error} /> : null}
        {message ? <div className={successLineClass}>{message}</div> : null}
      </div>
      {currentStep === 0 ? (
        <div className={drawerSectionClass}>
          <p className="m-0 rounded-panel border border-app-border bg-app-surface-muted px-3.5 py-3 text-sm leading-6 text-app-text-soft">
            These notes guide the first draft: tone, personal angles,
            technologies to emphasize, or details the job description does not
            make obvious.
          </p>
          <Textarea
            label="Instructions"
            onChange={(event) => setInstructions(event.target.value)}
            rows={8}
            value={instructions}
          />
          {isGenerating ? <InlineLoading label="Generating first draft" /> : null}
          <div className={drawerActionsClass}>
            <Button disabled={isGenerating} onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={isGenerating}
              icon={<Mail size={16} />}
              onClick={generateDraft}
              variant="primary"
            >
              {isGenerating ? 'Generating' : 'Generate Draft'}
            </Button>
          </div>
        </div>
      ) : null}
      {currentStep === 1 ? (
        <div className={drawerSectionClass}>
          <Textarea
            label="Draft"
            readOnly
            rows={16}
            value={draftMarkdown}
          />
          <Textarea
            label="Follow-up instructions"
            onChange={(event) => setRevisionInstructions(event.target.value)}
            rows={5}
            value={revisionInstructions}
          />
          {isRevising ? <InlineLoading label="Revising draft" /> : null}
          <div className={drawerActionsClass}>
            <Button
              disabled={isRevising}
              onClick={() => setCurrentStep(0)}
            >
              Back
            </Button>
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
              disabled={isRevising || !draftMarkdown}
              onClick={() => setCurrentStep(2)}
              variant="primary"
            >
              Continue
            </Button>
          </div>
        </div>
      ) : null}
      {currentStep === 2 ? (
        <div className={drawerSectionClass}>
          <Textarea
            label="Final draft"
            readOnly
            rows={16}
            value={draftMarkdown}
          />
          {isDownloading ? <InlineLoading label="Preparing PDF" /> : null}
          <div className={drawerActionsClass}>
            <Button
              disabled={isDownloading}
              onClick={() => setCurrentStep(1)}
            >
              Back
            </Button>
            <Button
              disabled={isDownloading || !draftMarkdown}
              icon={<Download size={16} />}
              onClick={downloadPdf}
              variant="primary"
            >
              {isDownloading ? 'Preparing' : 'Generate PDF'}
            </Button>
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}

function InlineLoading({ label }: { label: string }) {
  return (
    <div
      aria-live="polite"
      className="inline-flex items-center gap-inline text-sm font-semibold text-brand-700"
    >
      <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />
      <span>{label}</span>
    </div>
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

function toCoverLetterPdfFilename(companyName: string) {
  const safeCompanyName = companyName.trim().replace(/[/:\\]/g, '-');

  return `${safeCompanyName}-cover-letter.pdf`;
}
