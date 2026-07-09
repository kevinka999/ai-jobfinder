import { Clipboard, Plus, Search, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { ErrorState } from '../components/ErrorState';
import { MultiSelect } from '../components/MultiSelect';
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
  successLineClass,
} from '../design/classes';
import { apiRequest } from '../lib/api';
import {
  ImportJobsResponse,
  SOURCE_PLATFORMS,
  SourcePlatformId,
  WORK_MODEL_OPTIONS,
  WorkModel,
} from '../lib/types';

type PromptResponse = {
  prompt: string;
};

export function JobSearchPage() {
  const [sourcePlatformIds, setSourcePlatformIds] = useState<SourcePlatformId[]>(
    ['linkedin', 'stepstone'],
  );
  const [cities, setCities] = useState<string[]>(['Vienna']);
  const [cityInput, setCityInput] = useState('');
  const [workModels, setWorkModels] = useState<WorkModel[]>([
    'hybrid',
    'remote',
  ]);
  const [prompt, setPrompt] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [importResult, setImportResult] = useState<ImportJobsResponse | null>(
    null,
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  function addCity() {
    const nextCity = cityInput.trim();

    if (!nextCity || cities.includes(nextCity)) {
      setCityInput('');
      return;
    }

    setCities([...cities, nextCity]);
    setCityInput('');
  }

  async function generatePrompt() {
    setIsGenerating(true);
    setError(null);
    setCopyMessage(null);

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
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopyMessage('Prompt copied');
  }

  async function importJobs() {
    setIsImporting(true);
    setError(null);
    setImportResult(null);

    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(jsonText);
    } catch {
      setError('Pasted JSON is not valid.');
      setIsImporting(false);
      return;
    }

    try {
      const result = await apiRequest<ImportJobsResponse>('/jobs/import', {
        body: JSON.stringify(parsedJson),
        method: 'POST',
      });

      setImportResult(result);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className={pageStackClass}>
      <div className={pageHeadingClass}>
        <h1 className={pageTitleClass}>Job Search</h1>
        <Button
          disabled={
            isGenerating ||
            sourcePlatformIds.length === 0 ||
            cities.length === 0 ||
            workModels.length === 0
          }
          icon={<Search size={16} />}
          onClick={generatePrompt}
          variant="primary"
        >
          {isGenerating ? 'Generating' : 'Generate Prompt'}
        </Button>
      </div>
      {error ? <ErrorState message={error} /> : null}
      {copyMessage ? <div className={successLineClass}>{copyMessage}</div> : null}
      <div className={`${panelClass} grid gap-section`}>
        <MultiSelect
          label="Source platforms"
          onChange={setSourcePlatformIds}
          options={SOURCE_PLATFORMS}
          selected={sourcePlatformIds}
        />
        <div className={fieldClassName}>
          <span className={fieldLabelClassName}>Cities</span>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-inline">
            <label className={fieldClassName}>
              <span className="sr-only">City</span>
              <input
                className={inputClassName}
                onChange={(event) => setCityInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addCity();
                  }
                }}
                placeholder="Vienna"
                value={cityInput}
              />
            </label>
            <Button icon={<Plus size={16} />} onClick={addCity}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cities.map((city) => (
              <button
                className="inline-flex min-h-7 cursor-pointer items-center gap-1.5 rounded-control border border-brand-200 bg-brand-50 px-2 text-xs font-bold text-brand-700 hover:bg-brand-100"
                key={city}
                onClick={() =>
                  setCities(cities.filter((currentCity) => currentCity !== city))
                }
                type="button"
              >
                <span>{city}</span>
                <X size={14} />
              </button>
            ))}
          </div>
        </div>
        <MultiSelect
          label="Work models"
          onChange={setWorkModels}
          options={WORK_MODEL_OPTIONS}
          selected={workModels}
        />
      </div>
      <div className="grid items-stretch gap-section md:grid-cols-2">
        <div className={`${panelSectionClass} grid-rows-[auto_minmax(0,1fr)]`}>
          <div className={panelTitleRowClass}>
            <h2 className={panelTitleClass}>Generated Prompt</h2>
            <Button
              disabled={!prompt}
              icon={<Clipboard size={16} />}
              onClick={copyPrompt}
            >
              Copy
            </Button>
          </div>
          <textarea
            className="h-full min-h-80 resize-none rounded-control border border-app-border-strong bg-app-surface-muted px-2.5 py-2.5 font-mono text-sm text-app-text outline-none focus:border-brand-600 focus:shadow-focus"
            readOnly
            value={prompt}
            aria-label="Generated prompt"
          />
        </div>
        <div className={`${panelSectionClass} grid-rows-[auto_minmax(0,1fr)]`}>
          <div className={panelTitleRowClass}>
            <h2 className={panelTitleClass}>Import JSON</h2>
            <Button
              disabled={isImporting || jsonText.trim().length === 0}
              icon={<Upload size={16} />}
              onClick={importJobs}
              variant="primary"
            >
              {isImporting ? 'Importing' : 'Import'}
            </Button>
          </div>
          <Textarea
            className="h-full min-h-0 resize-none"
            label="External AI JSON"
            onChange={(event) => setJsonText(event.target.value)}
            placeholder={'{"jobs":[]}'}
            rows={13}
            value={jsonText}
          />
        </div>
      </div>
      {importResult ? <ImportResult result={importResult} /> : null}
    </section>
  );
}

function ImportResult({ result }: { result: ImportJobsResponse }) {
  return (
    <div className={panelSectionClass}>
      <h2 className={panelTitleClass}>Import Summary</h2>
      <div className="grid grid-cols-1 gap-inline sm:grid-cols-2 lg:grid-cols-4">
        <SummaryValue label="Received" value={result.summary.received} />
        <SummaryValue label="Active" value={result.summary.createdActive} />
        <SummaryValue label="Draft" value={result.summary.createdDraft} />
        <SummaryValue label="Invalid" value={result.summary.invalid} />
      </div>
      {result.invalidRows.length > 0 ? (
        <div className="grid gap-inline">
          {result.invalidRows.map((row) => (
            <div
              className="rounded-panel border border-danger-300 bg-danger-50 p-2.5"
              key={row.index}
            >
              <strong>Row {row.index + 1}</strong>
              <ul className="mb-0 mt-1.5 pl-[18px]">
                {row.errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SummaryValue({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-panel border border-app-border p-2.5">
      <strong className="block text-[22px] text-app-text">{value}</strong>
      <span className="block text-xs font-bold text-app-text-muted">
        {label}
      </span>
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error';
}
