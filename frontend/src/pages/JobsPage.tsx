import {
  AlertTriangle,
  Check,
  Download,
  LoaderCircle,
  Mail,
  PanelRightOpen,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Wand2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { JobOpenLink } from '../components/JobOpenLink';
import { JobTitleCell } from '../components/JobTitleCell';
import { LoadingState } from '../components/LoadingState';
import { Stepper } from '../components/Stepper';
import { useToast } from '../components/toastContext';
import {
  drawerActionsClass,
  drawerSectionClass,
  editFormGridClass,
  pageHeadingClass,
  pageStackClass,
  pageTitleClass,
  panelSectionClass,
  panelTitleClass,
  tableActionsClass,
} from '../design/classes';
import { apiBlob, apiRequest } from '../lib/api';
import {
  ApplicationResponse,
  JobEditableFields,
  JobResponse,
  SOURCE_PLATFORMS,
  SourcePlatformId,
  UserProfileResponse,
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
type JobMutationAction = 'apply' | 'delete' | 'keep';

export function JobsPage() {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<JobResponse | null>(null);
  const [coverLetterJob, setCoverLetterJob] = useState<JobResponse | null>(null);
  const [deleteConfirmationJob, setDeleteConfirmationJob] =
    useState<JobResponse | null>(null);
  const [mutatingJob, setMutatingJob] = useState<{
    action: JobMutationAction;
    id: string;
  } | null>(null);
  const toast = useToast();

  const draftJobs = useMemo(
    () => jobs.filter((job) => job.status === 'draft'),
    [jobs],
  );
  const activeJobs = useMemo(
    () => jobs.filter((job) => job.status === 'active'),
    [jobs],
  );

  const loadJobs = useCallback(async (showSuccessToast = false) => {
    setIsLoading(true);
    setError(null);

    try {
      setJobs(await apiRequest<JobResponse[]>('/jobs'));
      if (showSuccessToast) {
        toast.success('Jobs refreshed');
      }
    } catch (caughtError) {
      const message = getErrorMessage(caughtError);
      setError(message);
      toast.error(`Could not load jobs: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  async function keepDraft(job: JobResponse) {
    await mutateJob(
      () => apiRequest<JobResponse>(`/jobs/${job.id}/keep`, { method: 'POST' }),
      'Draft kept',
      job.id,
      'keep',
    );
  }

  async function deleteDraft(job: JobResponse) {
    const deleted = await mutateJob(
      () =>
        apiRequest<{ deleted: true }>(`/jobs/${job.id}`, { method: 'DELETE' }),
      'Draft deleted',
      job.id,
      'delete',
    );

    if (deleted) {
      setDeleteConfirmationJob(null);
    }
  }

  async function deleteActive(job: JobResponse) {
    const deleted = await mutateJob(
      () =>
        apiRequest<{ deleted: true }>(`/jobs/${job.id}`, { method: 'DELETE' }),
      'Job deleted',
      job.id,
      'delete',
    );

    if (deleted) {
      setDeleteConfirmationJob(null);
    }
  }

  async function confirmDelete(job: JobResponse) {
    if (job.status === 'draft') {
      await deleteDraft(job);
      return;
    }

    await deleteActive(job);
  }

  async function markApplied(job: JobResponse) {
    await mutateJob(
      () =>
        apiRequest<ApplicationResponse>(`/jobs/${job.id}/apply`, {
          method: 'POST',
        }),
      'Application created',
      job.id,
      'apply',
    );
  }

  async function mutateJob(
    action: () => Promise<unknown>,
    successMessage: string,
    jobId: string,
    mutationAction: JobMutationAction,
  ): Promise<boolean> {
    setMutatingJob({ action: mutationAction, id: jobId });

    try {
      await action();
      toast.success(successMessage);
      await loadJobs();
      return true;
    } catch (caughtError) {
      toast.error(`Could not update job: ${getErrorMessage(caughtError)}`);
      return false;
    } finally {
      setMutatingJob(null);
    }
  }

  const draftColumns: Array<DataTableColumn<JobResponse>> = [
    {
      header: 'Open',
      id: 'draft-open',
      render: (job) => <JobOpenLink job={job} />,
    },
    {
      header: 'Job',
      id: 'draft-job',
      render: (job) => <JobTitleCell job={job} />,
      sortValue: getJobSortLabel,
    },
    {
      header: 'Possible Duplicate',
      id: 'possible-duplicate',
      render: (job) => job.metadata?.possibleDuplicatedJobId ?? '—',
      sortValue: (job) => job.metadata?.possibleDuplicatedJobId,
    },
    {
      header: 'Actions',
      render: (job) => (
        <div className={tableActionsClass}>
          <Button
            aria-label="Keep draft"
            icon={<ShieldCheck size={15} />}
            isLoading={
              mutatingJob?.id === job.id && mutatingJob.action === 'keep'
            }
            onClick={() => keepDraft(job)}
          />
          <Button
            aria-label="Delete draft"
            icon={<Trash2 size={15} />}
            isLoading={
              mutatingJob?.id === job.id && mutatingJob.action === 'delete'
            }
            onClick={() => setDeleteConfirmationJob(job)}
            variant="danger"
          />
        </div>
      ),
    },
  ];

  const activeColumns: Array<DataTableColumn<JobResponse>> = [
    {
      header: 'Open',
      id: 'open',
      render: (job) => <JobOpenLink job={job} />,
    },
    {
      header: 'Job',
      id: 'job',
      render: (job) => <JobTitleCell job={job} />,
      sortValue: getJobSortLabel,
    },
    {
      header: 'Source',
      render: (job) => getSourceLabel(job.sourcePlatformId),
      sortValue: (job) => getSourceLabel(job.sourcePlatformId),
    },
    {
      header: 'Location',
      render: (job) => <LocationCell location={job.location} />,
      sortValue: (job) => job.location,
    },
    {
      header: 'Work',
      render: (job) => job.workModel ?? '—',
      sortValue: (job) => job.workModel,
    },
    {
      header: 'Match',
      id: 'match',
      render: (job) => job.matchingScore ?? '—',
      sortValue: (job) => job.matchingScore,
    },
    {
      header: 'Actions',
      render: (job) => (
        <div className={tableActionsClass}>
          <Button
            aria-label="Open job"
            icon={<PanelRightOpen size={15} />}
            onClick={() => setEditingJob(job)}
          />
          <Button
            aria-label="Create cover letter"
            icon={<Mail size={15} />}
            onClick={() => setCoverLetterJob(job)}
          />
          <ConfirmApplyButton
            isLoading={
              mutatingJob?.id === job.id && mutatingJob.action === 'apply'
            }
            onApply={() => markApplied(job)}
          />
          <Button
            aria-label="Delete active job"
            icon={<Trash2 size={15} />}
            isLoading={
              mutatingJob?.id === job.id && mutatingJob.action === 'delete'
            }
            onClick={() => setDeleteConfirmationJob(job)}
            variant="danger"
          />
        </div>
      ),
    },
  ];

  return (
    <section className={pageStackClass}>
      <div className={pageHeadingClass}>
        <h1 className={pageTitleClass}>Jobs</h1>
        <Button
          icon={<RefreshCw size={16} />}
          isLoading={isLoading}
          onClick={() => loadJobs(true)}
        >
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
          initialSort={{ columnId: 'match', direction: 'desc' }}
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
      <DeleteJobConfirmationModal
        isDeleting={
          !!deleteConfirmationJob &&
          mutatingJob?.id === deleteConfirmationJob.id &&
          mutatingJob.action === 'delete'
        }
        job={deleteConfirmationJob}
        onCancel={() => setDeleteConfirmationJob(null)}
        onConfirm={confirmDelete}
      />
    </section>
  );
}

function LocationCell({ location }: { location: string | null | undefined }) {
  if (!location) {
    return '—';
  }

  return (
    <span className="block max-w-32 whitespace-normal break-words">
      {location}
    </span>
  );
}

function ConfirmApplyButton({
  isLoading,
  onApply,
}: {
  isLoading: boolean;
  onApply: () => Promise<void>;
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setIsConfirming(false);
    }
  }, [isLoading]);

  function handleClick() {
    if (isLoading) {
      return;
    }

    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    setIsConfirming(false);
    void onApply();
  }

  return (
    <Button
      aria-label={
        isConfirming
          ? 'Confirm mark as applied'
          : 'Mark as applied, click again to confirm'
      }
      icon={<Check size={15} />}
      isLoading={isLoading}
      onBlur={() => setIsConfirming(false)}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setIsConfirming(false);
        }
      }}
      title={
        isConfirming
          ? 'Click again to mark as applied'
          : 'Mark as applied'
      }
      variant={isConfirming ? 'primary' : 'success'}
    />
  );
}

function DeleteJobConfirmationModal({
  isDeleting,
  job,
  onCancel,
  onConfirm,
}: {
  isDeleting: boolean;
  job: JobResponse | null;
  onCancel: () => void;
  onConfirm: (job: JobResponse) => Promise<void>;
}) {
  useEffect(() => {
    if (!job) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [job, onCancel]);

  if (!job) {
    return null;
  }

  const isDraft = job.status === 'draft';

  return (
    <div
      className="fixed inset-0 z-30 grid place-items-center bg-app-text/30 px-page-mobile"
      role="presentation"
    >
      <section
        aria-describedby="delete-job-confirmation-description"
        aria-labelledby="delete-job-confirmation-title"
        aria-modal="true"
        className="grid w-full max-w-[420px] gap-cluster rounded-panel border border-app-border bg-app-surface p-panel shadow-drawer"
        role="dialog"
      >
        <div className="flex items-start gap-cluster">
          <span className="grid size-9 shrink-0 place-items-center rounded-control border border-danger-300 bg-danger-50 text-danger-700">
            <AlertTriangle aria-hidden="true" size={18} />
          </span>
          <div className="grid gap-1">
            <h2
              className="m-0 text-base font-bold text-app-text"
              id="delete-job-confirmation-title"
            >
              Delete job?
            </h2>
            <p
              className="m-0 text-sm leading-6 text-app-text-muted"
              id="delete-job-confirmation-description"
            >
              {isDraft
                ? 'This draft job will be permanently removed.'
                : 'This active job will leave the active list, but future duplicates will still appear as drafts.'}
            </p>
          </div>
        </div>
        <div className={drawerActionsClass}>
          <Button disabled={isDeleting} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            icon={<Trash2 size={15} />}
            isLoading={isDeleting}
            onClick={() => onConfirm(job)}
            variant="danger"
          >
            Delete
          </Button>
        </div>
      </section>
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
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setForm(toJobFormState(job));
  }, [job]);

  async function saveJob() {
    if (!job) {
      return;
    }

    setIsSaving(true);

    try {
      await apiRequest<JobResponse>(`/jobs/${job.id}`, {
        body: JSON.stringify(toJobPatch(form)),
        method: 'PATCH',
      });
      await onSaved();
      toast.success('Job saved');
    } catch (caughtError) {
      toast.error(`Could not save job: ${getErrorMessage(caughtError)}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Drawer onClose={onClose} open={!!job} title="Job Details">
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
        <Button isLoading={isSaving} onClick={saveJob} variant="primary">
          Save
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
  const [isLoadingInstructionTemplate, setIsLoadingInstructionTemplate] =
    useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let ignore = false;

    setCurrentStep(0);
    setInstructions('');
    setRevisionInstructions('');
    setDraftMarkdown('');

    if (!job) {
      setIsLoadingInstructionTemplate(false);
      return;
    }

    async function loadInstructionTemplate() {
      setIsLoadingInstructionTemplate(true);

      try {
        const profile =
          await apiRequest<UserProfileResponse>('/users/profile');

        if (!ignore) {
          setInstructions(profile.coverLetterInstructionTemplate);
        }
      } catch (caughtError) {
        if (!ignore) {
          setInstructions('');
          toast.error(
            `Could not load instruction template: ${getErrorMessage(caughtError)}`,
          );
        }
      } finally {
        if (!ignore) {
          setIsLoadingInstructionTemplate(false);
        }
      }
    }

    void loadInstructionTemplate();

    return () => {
      ignore = true;
    };
  }, [job, toast]);

  async function generateDraft() {
    if (!job) {
      return;
    }

    setIsGenerating(true);

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
      toast.success('Cover letter draft generated');
    } catch (caughtError) {
      toast.error(
        `Could not generate cover letter draft: ${getErrorMessage(caughtError)}`,
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function reviseDraft() {
    if (!job || !draftMarkdown || !revisionInstructions.trim()) {
      return;
    }

    setIsRevising(true);

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
      toast.success('Draft revised');
    } catch (caughtError) {
      toast.error(`Could not revise draft: ${getErrorMessage(caughtError)}`);
    } finally {
      setIsRevising(false);
    }
  }

  async function downloadPdf() {
    if (!job || !draftMarkdown) {
      return;
    }

    setIsDownloading(true);

    try {
      const result = await apiBlob('/cover-letters/pdf', {
        body: JSON.stringify({
          jobId: job.id,
          finalDraftMarkdown: draftMarkdown,
        }),
        method: 'POST',
      });

      downloadBlob(result.blob, toCoverLetterPdfFilename(job.companyName));
      toast.success('PDF downloaded');
    } catch (caughtError) {
      toast.error(`Could not download PDF: ${getErrorMessage(caughtError)}`);
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
      </div>
      {currentStep === 0 ? (
        <div className={drawerSectionClass}>
          <p className="m-0 rounded-panel border border-app-border bg-app-surface-muted px-3.5 py-3 text-sm leading-6 text-app-text-soft">
            These notes guide the first draft: tone, personal angles,
            technologies to emphasize, or details the job description does not
            make obvious.
          </p>
          <Textarea
            disabled={isLoadingInstructionTemplate}
            label="Instructions"
            onChange={(event) => setInstructions(event.target.value)}
            rows={8}
            value={instructions}
          />
          {isLoadingInstructionTemplate ? (
            <InlineLoading label="Loading saved instructions" />
          ) : null}
          <div className={drawerActionsClass}>
            <Button
              disabled={isGenerating || isLoadingInstructionTemplate}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              disabled={isGenerating || isLoadingInstructionTemplate}
              icon={<Mail size={16} />}
              isLoading={isGenerating}
              onClick={generateDraft}
              variant="primary"
            >
              Generate Draft
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
              isLoading={isRevising}
              onClick={reviseDraft}
            >
              Revise
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
              isLoading={isDownloading}
              onClick={downloadPdf}
              variant="primary"
            >
              Generate PDF
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

function getJobSortLabel(job: JobResponse): string {
  return `${job.companyName} ${job.title}`;
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
