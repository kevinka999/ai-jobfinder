import {
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
import { CheckboxMenu } from '../components/CheckboxMenu';
import {
  CompanyHistoryBadge,
  CompanyHistoryDrawer,
} from '../components/CompanyHistory';
import { ConfirmActionButton } from '../components/ConfirmActionButton';
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
import { JobFavoriteButton } from '../components/JobFavoriteButton';
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
  CompanyApplicationHistoryResponse,
  JobEditableFields,
  JobResponse,
  SOURCE_PLATFORMS,
  SourcePlatformId,
  UserProfileResponse,
  WORK_MODEL_OPTIONS,
  WorkModel,
} from '../lib/types';
import { toCoverLetterPdfFilename } from '../lib/coverLetterFilename';

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
type JobMutationAction = 'apply' | 'delete' | 'favorite' | 'keep';

export function JobsPage() {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<JobResponse | null>(null);
  const [coverLetterJob, setCoverLetterJob] = useState<JobResponse | null>(null);
  const [companyHistoryByJobId, setCompanyHistoryByJobId] = useState<
    Record<string, CompanyApplicationHistoryResponse>
  >({});
  const [selectedCompanyHistoryJobId, setSelectedCompanyHistoryJobId] =
    useState<string | null>(null);
  const [isCompanyHistoryLoading, setIsCompanyHistoryLoading] = useState(false);
  const [activeJobNameFilter, setActiveJobNameFilter] = useState('');
  const [activeSourceFilters, setActiveSourceFilters] = useState<
    SourcePlatformId[]
  >([]);
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
  const filteredActiveJobs = useMemo(
    () =>
      filterActiveJobs(activeJobs, {
        nameFilter: activeJobNameFilter,
        sourceFilters: activeSourceFilters,
      }),
    [activeJobs, activeJobNameFilter, activeSourceFilters],
  );
  const hasActiveJobFilters =
    !!activeJobNameFilter.trim() || activeSourceFilters.length > 0;
  const selectedCompanyHistory = selectedCompanyHistoryJobId
    ? companyHistoryByJobId[selectedCompanyHistoryJobId] ?? null
    : null;

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

  useEffect(() => {
    if (!jobs.some((job) => job.matching?.status === 'pending' || job.matching?.status === 'processing')) return;
    const timer = window.setInterval(() => void loadJobs(), 5000);
    return () => window.clearInterval(timer);
  }, [jobs, loadJobs]);

  async function recalculateMatching() {
    try {
      const result = await apiRequest<{ summary: { eligible: number; queued: number; alreadyQueued: number; failedToQueue: number } }>('/jobs/matching/recalculate', { method: 'POST' });
      toast.success(`Queued ${result.summary.queued} of ${result.summary.eligible} jobs for matching.`);
      await loadJobs();
    } catch (caughtError) {
      toast.error(`Could not queue matching: ${getErrorMessage(caughtError)}`);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function loadCompanyHistory() {
      if (activeJobs.length === 0) {
        setCompanyHistoryByJobId({});
        setIsCompanyHistoryLoading(false);
        return;
      }

      setIsCompanyHistoryLoading(true);

      try {
        const histories = await apiRequest<CompanyApplicationHistoryResponse[]>(
          '/applications/company-history',
          {
            body: JSON.stringify({
              jobIds: activeJobs.map((job) => job.id),
            }),
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
  }, [activeJobs, toast]);

  async function keepDraft(job: JobResponse) {
    await mutateJob(
      () => apiRequest<JobResponse>(`/jobs/${job.id}/keep`, { method: 'POST' }),
      'Draft kept',
      job.id,
      'keep',
    );
  }

  async function deleteJob(job: JobResponse) {
    await mutateJob(
      () =>
        apiRequest<{ deleted: true }>(`/jobs/${job.id}`, { method: 'DELETE' }),
      job.status === 'draft' ? 'Draft deleted' : 'Job deleted',
      job.id,
      'delete',
    );
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

  async function toggleFavorite(job: JobResponse) {
    setMutatingJob({ action: 'favorite', id: job.id });

    try {
      const updatedJob = await apiRequest<JobResponse>(
        `/jobs/${job.id}/favorite`,
        {
          body: JSON.stringify({ isFavorite: !job.isFavorite }),
          method: 'PATCH',
        },
      );

      setJobs((currentJobs) =>
        currentJobs.map((currentJob) =>
          currentJob.id === updatedJob.id ? updatedJob : currentJob,
        ),
      );
      setEditingJob((currentJob) =>
        currentJob?.id === updatedJob.id ? updatedJob : currentJob,
      );
      setCoverLetterJob((currentJob) =>
        currentJob?.id === updatedJob.id ? updatedJob : currentJob,
      );
      toast.success(updatedJob.isFavorite ? 'Job favorited' : 'Job unfavorited');
    } catch (caughtError) {
      toast.error(`Could not update favorite: ${getErrorMessage(caughtError)}`);
    } finally {
      setMutatingJob(null);
    }
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
      header: 'Favorite',
      id: 'draft-favorite',
      render: (job) => (
        <JobFavoriteButton
          isLoading={
            mutatingJob?.id === job.id && mutatingJob.action === 'favorite'
          }
          job={job}
          onToggle={toggleFavorite}
        />
      ),
      sortValue: getFavoriteSortValue,
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
      defaultSortDirection: 'desc',
      header: 'Inserted',
      id: 'draft-inserted',
      render: (job) => formatShortDate(job.createdAt),
      sortValue: (job) => new Date(job.createdAt),
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
          <ConfirmActionButton
            ariaLabel="Delete draft"
            confirmAriaLabel="Confirm delete draft"
            confirmTitle="Click again to delete draft"
            icon={<Trash2 size={15} />}
            isLoading={
              mutatingJob?.id === job.id && mutatingJob.action === 'delete'
            }
            onConfirm={() => deleteJob(job)}
            title="Delete draft"
            confirmVariant="dangerPrimary"
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
      header: 'Favorite',
      id: 'favorite',
      render: (job) => (
        <JobFavoriteButton
          isLoading={
            mutatingJob?.id === job.id && mutatingJob.action === 'favorite'
          }
          job={job}
          onToggle={toggleFavorite}
        />
      ),
      sortValue: getFavoriteSortValue,
    },
    {
      header: 'Job',
      id: 'job',
      render: (job) => (
        <JobTitleCell
          companyMeta={
            <CompanyHistoryBadge
              history={companyHistoryByJobId[job.id]}
              isLoading={isCompanyHistoryLoading}
              onOpen={(history) =>
                setSelectedCompanyHistoryJobId(history.jobId)
              }
            />
          }
          job={job}
        />
      ),
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
      header: 'Match',
      id: 'match',
      render: (job) => job.matching?.status === 'completed' ? job.matchingScore ?? '—' : job.matching?.status === 'failed' ? 'Failed' : job.matching?.status === 'processing' ? 'Scoring…' : 'Pending',
      sortValue: (job) => job.matchingScore,
    },
    {
      defaultSortDirection: 'desc',
      header: 'Inserted',
      id: 'inserted',
      render: (job) => formatShortDate(job.createdAt),
      sortValue: (job) => new Date(job.createdAt),
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
          <ConfirmActionButton
            ariaLabel="Mark as applied, click again to confirm"
            confirmAriaLabel="Confirm mark as applied"
            confirmTitle="Click again to mark as applied"
            icon={<Check size={15} />}
            isLoading={
              mutatingJob?.id === job.id && mutatingJob.action === 'apply'
            }
            onConfirm={() => markApplied(job)}
            title="Mark as applied"
            variant="success"
          />
          <ConfirmActionButton
            ariaLabel="Delete active job"
            confirmAriaLabel="Confirm delete active job"
            confirmTitle="Click again to delete active job"
            icon={<Trash2 size={15} />}
            isLoading={
              mutatingJob?.id === job.id && mutatingJob.action === 'delete'
            }
            onConfirm={() => deleteJob(job)}
            title="Delete active job"
            confirmVariant="dangerPrimary"
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
        <Button icon={<RefreshCw size={16} />} onClick={recalculateMatching}>
          Recalculate matching scores
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
        <div className="grid gap-cluster lg:grid-cols-[minmax(220px,1fr)_minmax(260px,1.2fr)]">
          <label className="grid gap-1.5">
            <span className={fieldLabelClassName}>Filter by name</span>
            <input
              className={inputClassName}
              onChange={(event) => setActiveJobNameFilter(event.target.value)}
              placeholder="Job title or company"
              type="search"
              value={activeJobNameFilter}
            />
          </label>
          <CheckboxMenu
            emptyLabel="All sources"
            label="Source"
            menuLabel="Source filters"
            onChange={setActiveSourceFilters}
            options={SOURCE_PLATFORMS}
            selected={activeSourceFilters}
            selectedLabel={getSourceFilterLabel}
          />
        </div>
        {hasActiveJobFilters ? (
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setActiveJobNameFilter('');
                setActiveSourceFilters([]);
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : null}
        <DataTable
          columns={activeColumns}
          emptyLabel={
            hasActiveJobFilters
              ? 'No active jobs match these filters.'
              : 'No active jobs.'
          }
          getRowKey={(job) => job.id}
          initialSort={{ columnId: 'match', direction: 'desc' }}
          rows={filteredActiveJobs}
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
      <CompanyHistoryDrawer
        history={selectedCompanyHistory}
        onClose={() => setSelectedCompanyHistoryJobId(null)}
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
    if (!job || !draftMarkdown.trim() || !revisionInstructions.trim()) {
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
    if (!job || !draftMarkdown.trim()) {
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
            onChange={(event) => setDraftMarkdown(event.target.value)}
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
                !draftMarkdown.trim() ||
                revisionInstructions.trim().length === 0
              }
              icon={<Wand2 size={16} />}
              isLoading={isRevising}
              onClick={reviseDraft}
            >
              Revise
            </Button>
            <Button
              disabled={isRevising || !draftMarkdown.trim()}
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
              disabled={isDownloading || !draftMarkdown.trim()}
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

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
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

function getFavoriteSortValue(job: JobResponse): number {
  return job.isFavorite ? 0 : 1;
}

function toCompanyHistoryMap(
  histories: CompanyApplicationHistoryResponse[],
): Record<string, CompanyApplicationHistoryResponse> {
  return Object.fromEntries(
    histories.map((history) => [history.jobId, history]),
  );
}

function filterActiveJobs(
  jobs: JobResponse[],
  {
    nameFilter,
    sourceFilters,
  }: {
    nameFilter: string;
    sourceFilters: SourcePlatformId[];
  },
) {
  const normalizedFilter = normalizeFilterText(nameFilter);

  return jobs.filter(
    (job) =>
      matchesJobNameFilter(job, normalizedFilter) &&
      matchesSourceFilters(job, sourceFilters),
  );
}

function matchesJobNameFilter(
  job: JobResponse,
  normalizedFilter: string,
): boolean {
  if (!normalizedFilter) {
    return true;
  }

  return normalizeFilterText(getJobSortLabel(job)).includes(normalizedFilter);
}

function matchesSourceFilters(
  job: JobResponse,
  sourceFilters: SourcePlatformId[],
): boolean {
  if (sourceFilters.length === 0) {
    return true;
  }

  return sourceFilters.includes(job.sourcePlatformId);
}

function getSourceFilterLabel(selected: SourcePlatformId[]): string {
  if (selected.length === 0) {
    return 'All sources';
  }

  if (selected.length === 1) {
    return getSourceLabel(selected[0]);
  }

  return `${selected.length} sources`;
}

function normalizeFilterText(value: string): string {
  return value.trim().toLocaleLowerCase();
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
