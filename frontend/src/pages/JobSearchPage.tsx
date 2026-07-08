import { Clipboard, Plus, Search, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { ErrorState } from '../components/ErrorState';
import { MultiSelect } from '../components/MultiSelect';
import { Textarea, TextInput } from '../components/Field';
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
    <section className="page-stack">
      <div className="page-heading">
        <h1>Job Search</h1>
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
      {copyMessage ? <div className="success-line">{copyMessage}</div> : null}
      <div className="panel form-grid">
        <MultiSelect
          label="Source platforms"
          onChange={setSourcePlatformIds}
          options={SOURCE_PLATFORMS}
          selected={sourcePlatformIds}
        />
        <div className="field">
          <span>Cities</span>
          <div className="inline-input-row">
            <TextInput
              label="City"
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
            <Button icon={<Plus size={16} />} onClick={addCity}>
              Add
            </Button>
          </div>
          <div className="chip-list">
            {cities.map((city) => (
              <button
                className="removable-chip"
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
      <div className="split-grid">
        <div className="panel section-stack">
          <div className="panel-title-row">
            <h2>Generated Prompt</h2>
            <Button
              disabled={!prompt}
              icon={<Clipboard size={16} />}
              onClick={copyPrompt}
            >
              Copy
            </Button>
          </div>
          <textarea
            className="prompt-box"
            readOnly
            value={prompt}
            aria-label="Generated prompt"
          />
        </div>
        <div className="panel section-stack">
          <div className="panel-title-row">
            <h2>Import JSON</h2>
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
    <div className="panel section-stack">
      <h2>Import Summary</h2>
      <div className="summary-grid">
        <SummaryValue label="Received" value={result.summary.received} />
        <SummaryValue label="Active" value={result.summary.createdActive} />
        <SummaryValue label="Draft" value={result.summary.createdDraft} />
        <SummaryValue label="Invalid" value={result.summary.invalid} />
      </div>
      {result.invalidRows.length > 0 ? (
        <div className="invalid-list">
          {result.invalidRows.map((row) => (
            <div className="invalid-row" key={row.index}>
              <strong>Row {row.index + 1}</strong>
              <ul>
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
    <div className="summary-value">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error';
}
