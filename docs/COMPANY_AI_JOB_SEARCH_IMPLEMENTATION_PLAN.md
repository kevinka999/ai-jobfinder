# Company AI Job Search Implementation Plan

## Purpose

This plan sequences the feature that lets the user search for open jobs by company name through an automated AI-backed workflow.

The current Job Search page supports deterministic prompt generation plus manual JSON paste/import. This feature adds a second path:

1. user enters one or more company names;
2. backend creates one persisted process item per company;
3. backend enqueues one BullMQ message per company, in the same order submitted;
4. workers process up to three company searches concurrently;
5. each worker calls a provider abstraction;
6. the first provider implementation runs a bash script that invokes Codex CLI;
7. the provider returns the same `{ jobs: JobImportItem[] }` shape used by the manual import flow;
8. backend imports valid jobs through the existing import behavior;
9. frontend shows process history, status, inserted counts, inserted job IDs, invalid rows, and errors.

## Guiding Rules

- Keep the existing manual prompt and pasted JSON import workflow working.
- Use the same import schema and validation rules as `POST /jobs/import`.
- Use stored user profile data, especially `jobTitleKeywords` and weighted `technicalSkillKeywords`, as the qualification source.
- Treat company AI search as a backend automation workflow, not as frontend scraping.
- Persist process state before queueing so every company submission has a durable audit trail.
- Use polymorphism for the search execution provider. Codex CLI is only the first provider implementation.
- Do not let queue workers bypass application use cases or duplicate detection rules.

## Proposed Backend Concepts

### Company Search Item

Create a new MongoDB collection for company search process items.

```ts
type CompanyJobSearchItem = {
  _id: string;
  userId: string;
  batchId: string;
  companyName: string;
  status: "queued" | "processing" | "processed" | "error";
  provider: "codex-cli";
  queueJobId?: string;
  queuedAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  insertedJobIds: string[];
  insertedActiveJobIds: string[];
  insertedDraftJobIds: string[];
  invalidRows: Array<{
    index: number;
    reason: string;
  }>;
  importedCount: number;
  activeCount: number;
  draftCount: number;
  invalidCount: number;
  errorMessage?: string;
  rawProviderOutputPath?: string;
  createdAt: Date;
  updatedAt: Date;
};
```

`batchId` groups company names submitted together while still allowing each company to be queued, processed, retried, and displayed independently.

### Provider Port

Define an application port for the execution strategy.

```ts
type CompanyJobSearchProviderInput = {
  companyName: string;
  jobTitleKeywords: string[];
  technicalSkillKeywords: Array<{
    keyword: string;
    weight: number;
  }>;
};

type CompanyJobSearchProviderResult = {
  jobs: JobImportItem[];
  rawOutputPath?: string;
};

interface CompanyJobSearchProvider {
  searchCompanyJobs(
    input: CompanyJobSearchProviderInput,
  ): Promise<CompanyJobSearchProviderResult>;
}
```

The first implementation should be a `CodexCliCompanyJobSearchProvider` that calls a bash script. Future providers can replace it without changing the queue consumer or import use case.

## Phase 1: Product And Contract Documentation

- [ ] Phase complete

References: [Product spec](PRODUCT_SPEC.md), [API contract](API_CONTRACT.md), and [domain model](DOMAIN_MODEL.md).

### Tasks

- Document the Company AI Search option on the Job Search page.
- Document that company search is automated and queued, unlike broad search and links search.
- Document the new process-item collection and status meanings.
- Document the API endpoints for creating company searches and reading history.
- Document that provider output must use the existing `{ jobs: JobImportItem[] }` import shape.
- Clarify that this feature is allowed to scrape through an external provider while the existing manual prompt flow remains deterministic.

### Acceptance Criteria

- Product, API, and domain docs describe the new workflow consistently.
- Docs make clear that one company name creates one queue item.
- Docs make clear that import validation and duplicate detection are reused.

## Phase 2: Queue Infrastructure

- [ ] Phase complete

References: [backend architecture](../backend/docs/ARCHITECTURE.md).

### Tasks

- Add BullMQ and the required Redis configuration.
- Add Redis to local development infrastructure.
- Add backend environment variables for Redis connection and queue settings.
- Define a dedicated company job search queue name.
- Configure worker concurrency to `3`.
- Add a queue module that can be imported by the company search workflow.

### Acceptance Criteria

- Backend can connect to Redis locally.
- Company search queue can enqueue and consume jobs.
- Worker concurrency is capped at three active company searches.

## Phase 3: Process Persistence

- [ ] Phase complete

References: [data ownership rules](DOMAIN_MODEL.md#data-ownership-and-isolation).

### Tasks

- Add `CompanyJobSearchItem` domain type.
- Add Mongoose schema and indexes.
- Store `userId`, `batchId`, `companyName`, `status`, queue metadata, timestamps, inserted job IDs, counts, invalid rows, and error details.
- Add repository methods for create, mark queued, mark processing, mark processed, mark error, list history, and find by ID.
- Ensure every lookup is scoped by default user.

### Recommended Indexes

- `{ userId: 1, createdAt: -1 }`.
- `{ userId: 1, batchId: 1 }`.
- `{ status: 1, queuedAt: 1 }`.
- Optional unique deduplication should not be added for company names in MVP; the user may intentionally search the same company again later.

### Acceptance Criteria

- A submitted company has a durable process item before queue enqueue is attempted.
- Process items can be listed for history UI.
- Failed processing keeps enough error detail for the UI.

## Phase 4: Company Search API

- [ ] Phase complete

References: [Job search prompt API](API_CONTRACT.md#job-search-prompt-api) and [User domain](DOMAIN_MODEL.md#user).

### Tasks

- Implement `POST /job-search/company-ai`.
- Accept one or more company names.
- Normalize input by trimming whitespace and removing empty values.
- Preserve submitted order for queue creation.
- Create one process item per company name before enqueueing.
- Enqueue one BullMQ message per company item.
- Save the resulting queue job ID back to the process item.
- Implement `GET /job-search/company-ai/history`.
- Implement `GET /job-search/company-ai/history/:itemId`.

### Suggested Request

```ts
type Request = {
  companyNames: string[];
};
```

### Suggested Response

```ts
type Response = {
  batchId: string;
  items: Array<{
    id: string;
    companyName: string;
    status: "queued";
    queueJobId?: string;
  }>;
};
```

### Acceptance Criteria

- The API creates one queue message per company name.
- Queue messages are added in the same order as the submitted company names.
- If enqueueing fails for one item, that item is marked `error` without deleting already-created process history.
- History responses include status, counts, inserted job IDs, invalid rows, and error details.

## Phase 5: Prompt Builder For Company Search

- [ ] Phase complete

References: [Job search prompt API](API_CONTRACT.md#job-search-prompt-api), [job import API](API_CONTRACT.md#job-import-api), and [SourcePlatformId](DOMAIN_MODEL.md#sourceplatformid).

### Tasks

- Create a deterministic company-search prompt builder.
- Reuse the same profile keyword formatting used by current job search prompts.
- Instruct the agent to search the internet deeply for active opening positions at the named company.
- Instruct the agent to search company career pages first, then reputable job boards and indexed postings.
- Instruct the agent to include only roles aligned with stored job-title keywords and weighted technical keywords.
- Instruct the agent to use `others` for direct employer pages or unknown sources.
- Instruct the agent to translate human-readable fields to English.
- Embed the same compact JSON Schema used by the existing import prompt.
- Require output as valid JSON only in the object wrapper:

```json
{
  "jobs": []
}
```

### Acceptance Criteria

- Company search prompt is close to the existing generated search prompt.
- Provider output can be passed into the same import validation path as pasted JSON.
- Prompt tests cover company name, keyword bands, `others`, English output, and schema inclusion.

## Phase 6: Provider Abstraction And Codex CLI Provider

- [ ] Phase complete

References: [application ports](../backend/docs/ARCHITECTURE.md#application-ports) and [workflow placement](../backend/docs/ARCHITECTURE.md#workflow-placement).

### Tasks

- Define `CompanyJobSearchProvider` as an application port.
- Add provider injection token.
- Implement `CodexCliCompanyJobSearchProvider`.
- Add a bash script invoked by the provider.
- Pass the generated prompt to the script safely.
- Capture stdout, stderr, exit code, and optional raw output file path.
- Parse provider output as JSON.
- Validate that the parsed object has a `jobs` array before import.
- Add timeout and max-output safeguards.

### Script Responsibilities

- Receive a prompt and company context from the backend provider.
- Run the configured Codex CLI command.
- Ask the agent to scrape/search for active job openings for that company.
- Return only the JSON object expected by the import flow.

### Acceptance Criteria

- Queue worker depends on `CompanyJobSearchProvider`, not on Codex CLI directly.
- Codex CLI command can be replaced through a different provider implementation.
- Provider failures produce controlled errors and do not crash the worker process.

## Phase 7: Queue Consumer And Import Integration

- [ ] Phase complete

References: [Job import API](API_CONTRACT.md#job-import-api), [Job domain](DOMAIN_MODEL.md#job), and [duplicate detection rules](DOMAIN_MODEL.md#duplicate-detection-rules).

### Tasks

- Implement BullMQ processor for company search items.
- Load the process item and mark it `processing`.
- Load the user's stored job-title and technical-skill keywords.
- Call the injected `CompanyJobSearchProvider`.
- Pass returned jobs into the existing import use case or shared import service.
- Reuse strict row-level validation, partial success, duplicate detection, active/draft creation, and invalid row handling.
- Save inserted job IDs, active job IDs, draft job IDs, counts, invalid rows, raw output path, and final status.
- Mark the item `processed` when provider execution and import handling complete, even if zero jobs were inserted and invalid rows were recorded.
- Mark the item `error` when provider execution fails, output cannot be parsed, or import integration throws unexpectedly.

### Acceptance Criteria

- Worker processes no more than three company searches concurrently.
- Successful provider output imports jobs through the same behavior as manual paste/import.
- Process history shows inserted IDs and counts after processing.
- Errors are visible in process history and do not lose the original submitted company item.

## Phase 8: Frontend Company Search Mode

- [ ] Phase complete

References: [Job Search frontend phase](IMPLEMENTATION_PLAN.md#phase-12-job-search-frontend) and [frontend design system](../frontend/docs/DESIGN_SYSTEM.md).

### Tasks

- Add a new Job Search page option for Company AI Search.
- Reuse the existing tab or segmented-control pattern for job search modes.
- Give the Company AI Search option button a distinct AI-style treatment, such as a subtle animated dashed background or border effect, while keeping it consistent with the shared design system.
- Add a multi-value company-name input.
- Submit company names to `POST /job-search/company-ai`.
- Show immediate queued feedback per company.
- Add a history area for company AI search items.
- Show status badges for `queued`, `processing`, `processed`, and `error`.
- Show inserted job counts and links or IDs for imported jobs.
- Show invalid row counts and error details in a compact detail drawer or expandable row.
- Refresh history after submission and while items are active.

### Acceptance Criteria

- User can enter multiple companies and enqueue them together.
- Frontend does not require pasted JSON for Company AI Search.
- Company AI Search is visually distinguishable from the normal prompt-generation options through a restrained AI-style button treatment.
- History makes it clear which company created which imported jobs.
- Existing broad search, link search, and manual import UI still work.

## Phase 9: Tests And Verification

- [ ] Phase complete

References: [backend architecture](../backend/docs/ARCHITECTURE.md), [API contract](API_CONTRACT.md), and [domain model](DOMAIN_MODEL.md).

### Backend Test Focus

- Company names are normalized and empty values rejected.
- Process items are created before queue enqueue.
- One queue message is created per company in submitted order.
- Enqueue failure marks only the affected item as `error`.
- Worker marks item `processing`.
- Worker calls the provider port.
- Valid provider jobs are imported through existing import logic.
- Duplicate provider jobs become drafts.
- Invalid provider rows are recorded on the process item.
- Provider parse failure marks item `error`.
- Worker concurrency is configured as `3`.

### Frontend Test Focus

- Company search mode renders.
- Multi-company input submits the expected payload.
- Queued response appears per company.
- History renders status, counts, inserted job IDs, invalid rows, and error state.
- Existing prompt generation and pasted JSON import flows still render.

### Manual Verification

- Start MongoDB and Redis locally.
- Start backend worker with concurrency `3`.
- Submit at least four company names and confirm only three process at once.
- Use a fake provider or fixture provider for deterministic import verification.
- Run one local Codex CLI provider smoke test only after the scripted command is configured.

## Phase 10: Operational Guardrails

- [ ] Phase complete

### Tasks

- Add clear environment configuration for provider selection.
- Add provider timeout configuration.
- Add max output size configuration.
- Add logging around queue item lifecycle transitions.
- Ensure script arguments and prompt files avoid shell injection.
- Decide retention behavior for raw provider output files.
- Document how to run the worker locally.

### Acceptance Criteria

- Provider can be switched without changing use cases.
- Long-running or noisy provider calls fail predictably.
- Logs can connect a queue job ID to a persisted process item ID.
- Local setup instructions are enough to run the full queued workflow.
