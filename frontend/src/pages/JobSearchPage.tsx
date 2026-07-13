import { Clipboard, Link, Plus, Search, Upload, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from '../components/Button';
import { MultiSelect } from '../components/MultiSelect';
import { useToast } from '../components/toastContext';
import {
  fieldClassName,
  fieldLabelClassName,
  inputClassName,
  Textarea,
} from '../components/Field';
import {
  pageHeadingClass,
  pageStackClass,
  pageTitleClass,
  panelClass,
  panelSectionClass,
  panelTitleClass,
  panelTitleRowClass,
} from '../design/classes';
import { apiRequest } from '../lib/api';
import { cx } from '../lib/classNames';
import {
  ImportJobsResponse,
  DEFAULT_SEARCH_WORK_MODELS,
  SEARCH_SOURCE_PLATFORMS,
  SourcePlatformId,
  WORK_MODEL_OPTIONS,
  WorkModel,
} from '../lib/types';

type PromptResponse = {
  prompt: string;
};

type PromptTab = 'search' | 'links';

export function JobSearchPage() {
  const [activePromptTab, setActivePromptTab] = useState<PromptTab>('search');
  const [sourcePlatformIds, setSourcePlatformIds] = useState<SourcePlatformId[]>(
    ['linkedin', 'stepstone'],
  );
  const [cities, setCities] = useState<string[]>(['Vienna']);
  const [cityInput, setCityInput] = useState('');
  const [workModels, setWorkModels] = useState<WorkModel[]>(
    DEFAULT_SEARCH_WORK_MODELS,
  );
  const [prompt, setPrompt] = useState('');
  const [jobLinks, setJobLinks] = useState<string[]>([]);
  const [jobLinkInput, setJobLinkInput] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingLinkPrompt, setIsGeneratingLinkPrompt] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const toast = useToast();

  function addCity() {
    const nextCities = parseInputItems(cityInput);

    if (nextCities.length === 0) {
      setCityInput('');
      return;
    }

    setCities(addUniqueItems(cities, nextCities));
    setCityInput('');
  }

  function addJobLinks() {
    const nextJobLinks = parseInputItems(jobLinkInput);

    if (nextJobLinks.length === 0) {
      setJobLinkInput('');
      return;
    }

    setJobLinks(addUniqueItems(jobLinks, nextJobLinks));
    setJobLinkInput('');
  }

  async function generatePrompt() {
    setIsGenerating(true);

    try {
      const result = await apiRequest<PromptResponse>('/job-search/prompt', {
        body: JSON.stringify({
          sourcePlatformIds,
          cities,
          workModels,
        }),
        method: 'POST',
      });

      setPrompt(result.prompt);
      toast.success('Prompt generated');
    } catch (caughtError) {
      toast.error(`Could not generate prompt: ${getErrorMessage(caughtError)}`);
    } finally {
      setIsGenerating(false);
    }
  }

  async function generateLinkPrompt() {
    setIsGeneratingLinkPrompt(true);

    try {
      const result = await apiRequest<PromptResponse>(
        '/job-search/links/prompt',
        {
          body: JSON.stringify({ jobLinks }),
          method: 'POST',
        },
      );

      setPrompt(result.prompt);
      toast.success('Link prompt generated');
    } catch (caughtError) {
      toast.error(
        `Could not generate link prompt: ${getErrorMessage(caughtError)}`,
      );
    } finally {
      setIsGeneratingLinkPrompt(false);
    }
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success('Prompt copied');
    } catch (caughtError) {
      toast.error(`Could not copy prompt: ${getErrorMessage(caughtError)}`);
    }
  }

  async function importJobs() {
    setIsImporting(true);

    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(jsonText);
    } catch {
      toast.error('Pasted JSON is not valid.');
      setIsImporting(false);
      return;
    }

    try {
      const result = await apiRequest<ImportJobsResponse>('/jobs/import', {
        body: JSON.stringify(parsedJson),
        method: 'POST',
      });
      const added = result.summary.createdActive + result.summary.createdDraft;
      const message = formatImportToastMessage(result);

      if (result.summary.invalid === 0) {
        toast.success(message, { durationMs: 7000 });
      } else if (added > 0) {
        toast.warning(message, { durationMs: 9000 });
      } else {
        toast.error(message, { durationMs: 9000 });
      }
    } catch (caughtError) {
      toast.error(`Could not import jobs: ${getErrorMessage(caughtError)}`);
    } finally {
      setIsImporting(false);
    }
  }

  const generateButtonDisabled =
    isGenerating ||
    isGeneratingLinkPrompt ||
    (activePromptTab === 'search' &&
      (sourcePlatformIds.length === 0 ||
        cities.length === 0 ||
        workModels.length === 0)) ||
    (activePromptTab === 'links' && jobLinks.length === 0);
  const generateButtonIcon =
    activePromptTab === 'search' ? <Search size={16} /> : <Link size={16} />;
  const generateButtonIsLoading =
    activePromptTab === 'search' ? isGenerating : isGeneratingLinkPrompt;
  const generateButtonHandler =
    activePromptTab === 'search' ? generatePrompt : generateLinkPrompt;

  return (
    <section className={pageStackClass}>
      <div className={pageHeadingClass}>
        <h1 className={pageTitleClass}>Job Search</h1>
      </div>
      <div className={`${panelClass} grid content-start gap-section`}>
        <div className={panelTitleRowClass}>
          <h2 className={panelTitleClass}>Prompt Generator</h2>
        </div>
        <div
          aria-label="Prompt type"
          className="grid w-full grid-cols-2 rounded-control border border-app-border-strong bg-app-surface-muted p-1 shadow-inner sm:w-fit sm:min-w-[380px]"
          role="tablist"
        >
          <PromptTabButton
            active={activePromptTab === 'search'}
            id="search-prompt-tab"
            icon={<Search size={16} />}
            onClick={() => setActivePromptTab('search')}
            panelId="search-prompt-panel"
          >
            Search Prompt
          </PromptTabButton>
          <PromptTabButton
            active={activePromptTab === 'links'}
            id="job-links-prompt-tab"
            icon={<Link size={16} />}
            onClick={() => setActivePromptTab('links')}
            panelId="job-links-prompt-panel"
          >
            Job Links Prompt
          </PromptTabButton>
        </div>
        {activePromptTab === 'search' ? (
          <div
            aria-labelledby="search-prompt-tab"
            className="grid gap-section"
            id="search-prompt-panel"
            role="tabpanel"
          >
            <MultiSelect
              label="Source platforms"
              onChange={setSourcePlatformIds}
              options={SEARCH_SOURCE_PLATFORMS}
              selected={sourcePlatformIds}
            />
            <TokenInput
              addButtonLabel="Add"
              inputLabel="City"
              inputPlaceholder="Vienna"
              inputValue={cityInput}
              label="Cities"
              onAdd={addCity}
              onInputChange={setCityInput}
              onRemove={(city) =>
                setCities(cities.filter((currentCity) => currentCity !== city))
              }
              values={cities}
            />
            <MultiSelect
              label="Work models"
              onChange={setWorkModels}
              options={WORK_MODEL_OPTIONS}
              selected={workModels}
            />
          </div>
        ) : (
          <div
            aria-labelledby="job-links-prompt-tab"
            className="grid gap-section"
            id="job-links-prompt-panel"
            role="tabpanel"
          >
            <TokenInput
              addButtonLabel="Add"
              inputLabel="Job link"
              inputPlaceholder="https://company.example/jobs/frontend-developer"
              inputValue={jobLinkInput}
              label="Job links"
              onAdd={addJobLinks}
              onInputChange={setJobLinkInput}
              onRemove={(jobLink) =>
                setJobLinks(
                  jobLinks.filter((currentJobLink) => currentJobLink !== jobLink),
                )
              }
              values={jobLinks}
            />
          </div>
        )}
        <div className="grid gap-cluster">
          <h2 className={panelTitleClass}>Generated Prompt</h2>
          <textarea
            aria-label="Generated prompt"
            className="min-h-28 resize-none rounded-control border border-app-border-strong bg-app-surface-muted px-2.5 py-2.5 font-mono text-sm text-app-text outline-none focus:border-brand-600 focus:shadow-focus"
            readOnly
            value={prompt}
          />
          <div className="flex justify-end gap-inline">
            <Button
              disabled={!prompt}
              icon={<Clipboard size={16} />}
              onClick={copyPrompt}
            >
              Copy
            </Button>
            <Button
              disabled={generateButtonDisabled}
              icon={generateButtonIcon}
              isLoading={generateButtonIsLoading}
              onClick={generateButtonHandler}
              variant="primary"
            >
              Generate
            </Button>
          </div>
        </div>
      </div>
      <div className={`${panelSectionClass} grid-rows-[auto_minmax(0,1fr)]`}>
        <div className={panelTitleRowClass}>
          <h2 className={panelTitleClass}>Import JSON</h2>
          <Button
            disabled={isImporting || jsonText.trim().length === 0}
            icon={<Upload size={16} />}
            isLoading={isImporting}
            onClick={importJobs}
            variant="primary"
          >
            Import
          </Button>
        </div>
        <Textarea
          className="h-full min-h-72 resize-none"
          label="External AI JSON"
          onChange={(event) => setJsonText(event.target.value)}
          placeholder={'{"jobs":[]}'}
          rows={13}
          value={jsonText}
        />
      </div>
    </section>
  );
}

function PromptTabButton({
  active,
  children,
  id,
  icon,
  onClick,
  panelId,
}: {
  active: boolean;
  children: string;
  id: string;
  icon: ReactNode;
  onClick: () => void;
  panelId: string;
}) {
  return (
    <button
      aria-controls={panelId}
      aria-selected={active}
      className={cx(
        'inline-flex min-h-10 items-center justify-center gap-inline rounded-control border px-3 text-sm font-semibold transition-colors outline-none focus-visible:shadow-focus',
        active
          ? 'border-brand-200 bg-app-surface text-brand-700 shadow-sm'
          : 'border-transparent text-app-text-muted hover:bg-app-surface hover:text-app-text',
      )}
      id={id}
      onClick={onClick}
      role="tab"
      type="button"
    >
      {icon}
      {children}
    </button>
  );
}

function TokenInput({
  addButtonLabel,
  inputLabel,
  inputPlaceholder,
  inputValue,
  label,
  onAdd,
  onInputChange,
  onRemove,
  values,
}: {
  addButtonLabel: string;
  inputLabel: string;
  inputPlaceholder: string;
  inputValue: string;
  label: string;
  onAdd: () => void;
  onInputChange: (value: string) => void;
  onRemove: (value: string) => void;
  values: string[];
}) {
  return (
    <div className={fieldClassName}>
      <span className={fieldLabelClassName}>{label}</span>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-inline">
        <label className={fieldClassName}>
          <span className="sr-only">{inputLabel}</span>
          <input
            className={inputClassName}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onAdd();
              }
            }}
            placeholder={inputPlaceholder}
            value={inputValue}
          />
        </label>
        <Button icon={<Plus size={16} />} onClick={onAdd}>
          {addButtonLabel}
        </Button>
      </div>
      {values.length > 0 ? (
        <div className="flex min-w-0 max-w-full flex-wrap gap-1.5">
          {values.map((value) => (
            <button
              aria-label={`Remove ${value}`}
              className="flex min-h-7 min-w-0 max-w-full items-center gap-1 rounded-control border border-brand-200 bg-brand-50 px-2 text-xs font-semibold leading-none text-brand-700 transition-colors hover:bg-brand-100"
              key={value}
              onClick={() => onRemove(value)}
              title={value}
              type="button"
            >
              <span className="block min-w-0 flex-1 truncate text-left">{value}</span>
              <X className="shrink-0" size={14} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error';
}

function formatImportToastMessage(result: ImportJobsResponse): string {
  const { createdActive, createdDraft, invalid, received } = result.summary;
  const added = createdActive + createdDraft;
  const summary = `Import finished: ${added} added (${createdActive} active, ${createdDraft} draft), ${invalid} invalid out of ${received}.`;
  const firstInvalidRow = result.invalidRows[0];

  if (!firstInvalidRow) {
    return summary;
  }

  return `${summary} First error: row ${firstInvalidRow.index + 1}: ${firstInvalidRow.errors.join(', ')}.`;
}

function parseInputItems(value: string): string[] {
  return value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function addUniqueItems(currentItems: string[], nextItems: string[]): string[] {
  const itemSet = new Set(currentItems);
  const items = [...currentItems];

  nextItems.forEach((item) => {
    if (!itemSet.has(item)) {
      itemSet.add(item);
      items.push(item);
    }
  });

  return items;
}
