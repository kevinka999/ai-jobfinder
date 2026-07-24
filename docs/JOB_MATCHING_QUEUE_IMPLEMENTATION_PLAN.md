# Job Matching Queue Implementation Plan

## Purpose

This plan replaces imported, external `matchingScore` values with a backend-owned, asynchronous job-matching workflow.

Each BullMQ message represents exactly one persisted job. A worker compares that job's title, full description, and optional `techStack` with the default user's stored job-title keywords and weighted main and secondary technical-skill keywords, then saves an explainable score from `0` to `100`.

The feature has two required entry points:

1. every newly persisted job is queued for matching automatically;
2. `POST /jobs/matching/recalculate` queues every non-deleted job for a fresh score.

The existing import, duplicate-detection, and job-status workflows remain unchanged. Scoring happens only after a job has been persisted.

## Guiding Decisions

- Use a dedicated `job-matching` BullMQ queue backed by Redis; do not put matching work in the HTTP request.
- Queue one message per job, never one message containing an array of jobs.
- Treat `matchingScore` and `matchingReason` as backend-owned after this feature ships. Scores supplied by external search/import JSON remain accepted for backward-compatible input validation but are discarded on persistence; the fields stay empty until the queued matcher produces the authoritative result.
- Score `draft`, `active`, and `applied` jobs. Exclude soft-deleted jobs from new queue work and never restore or score them through the bulk endpoint.
- Keep matching status separate from the existing job workflow `status` (`draft`, `active`, `applied`).
- Make the result explainable: store a short reason and structured score evidence, not an opaque number alone.
- Use the saved keyword weights as the source of truth. Do not infer experience level from an arbitrary skill list or use raw resume text in the first version.
- Make queue operations idempotent and version-aware so duplicate delivery, retries, concurrent recalculations, and edits cannot save a stale result.
- Start with a hybrid evaluator: deterministic evidence extraction and weighted scoring establish the baseline; a structured AI evaluation handles responsibility-level semantic fit. The AI result is bounded by deterministic validation and must cite job-description evidence.

## Target Flow

```text
Create/import job ──> persist job ──> mark match pending ──> enqueue one job ID
                                                              │
Bulk recalculate ──> list non-deleted jobs ──────────────────┤
                                                              ▼
                                                       BullMQ worker
                                                              │
                              load current job + versioned profile snapshot
                                                              │
                                                              ▼
                         evidence extraction + weighted hybrid evaluation
                                                              │
                                                              ▼
                           save score only when revisions still match
```

## Matching Algorithm

### Inputs

The worker evaluates only persisted data:

```ts
type JobMatchInput = {
  job: {
    id: string;
    title: string;
    description: string;
    techStack?: string[];
  };
  profile: {
    jobTitleKeywords: string[];
    mainTechnicalSkillKeywords: Array<{
      keyword: string;
      weight: number; // 1-10
    }>;
    secondaryTechnicalSkillKeywords: Array<{
      keyword: string;
      weight: number; // 1-10
    }>;
  };
};
```

`techStack` is useful structured evidence, but must not be the only source. Many imported jobs have incomplete or absent stack data, so the title and full description remain required inputs.

### Evidence Preparation

1. Normalize case, spacing, punctuation, common framework/runtime spelling, and aliases (`Node`, `Node.js`, and `nodejs`; `Postgres` and `PostgreSQL`; `React.js` and `React`).
2. Build a small, reviewed canonical alias dictionary. It must be explicit and testable; do not use unconstrained fuzzy matching that could turn unrelated words into skill matches.
3. Extract skill evidence from `techStack`, title, and description. Record where each match came from and whether the description frames it as required, preferred, or incidental.
4. Normalize profile technical skills through the same dictionary and retain their user-defined weights.
5. Identify job-title/profile-title alignment independently from technical-skill overlap.

### Score Composition

The evaluator produces a final integer between `0` and `100` from these bounded components:

| Component | Range | Rule |
| --- | ---: | --- |
| Role/title alignment | 0-20 | Compares the job title and central role wording with stored job-title keywords; title overlap alone cannot create a high score. |
| Weighted technical coverage | 0-45 | Uses a weighted coverage ratio across profile technical skills. Strong skills (`8-10`) contribute materially more than moderate (`4-7`) and weak/historical (`1-3`) skills. A required, structured-stack match is stronger evidence than an incidental description mention. |
| Responsibilities and engineering context | 0-25 | Structured AI evaluation compares the job's actual responsibilities, seniority, and product/engineering context with the profile signals. It must return concise, verifiable evidence from the posting. |
| Requirement quality and gaps | 0-10 | Rewards clear support for the candidate's primary direction and reduces this component when the role's essential requirements are mostly outside the profile. |

The matching provider returns the responsibility/context and gap assessment as structured JSON, including matched strengths, meaningful gaps, and the supporting posting excerpts. Backend validation rejects out-of-range component scores, missing evidence, invented profile skills, and unsupported output.

Hard guardrails prevent misleading results:

- A role whose central responsibilities are outside the candidate's title direction or strong skills cannot score above `59` merely because it contains isolated technology names.
- A role that is fundamentally outside the candidate's profile (for example, non-engineering work with incidental tech references) cannot score above `39`.
- Weak/historical skills add limited evidence and cannot outweigh missing strong-skill or role alignment.
- Missing or empty `techStack` is not a failure; the evaluator uses description evidence and records lower confidence where appropriate.
- The final reason is short, human-readable, and names the strongest evidence plus the most important gap. It must not claim experience that is absent from the stored profile.

### Stored Output

The worker writes `matchingScore`, `matchingReason`, and a compact evidence object suitable for future UI detail. Suggested shape:

```ts
type JobMatching = {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  profileVersion: number;
  inputVersion: number;
  requestedVersion: number;
  scoredAt?: Date;
  errorMessage?: string;
  evidence?: {
    titleScore: number;
    technicalScore: number;
    responsibilityScore: number;
    requirementScore: number;
    matchedSkills: string[];
    missingOrWeakAreas: string[];
  };
};
```

`matchingScore` and `matchingReason` stay at the current top level for existing table and API compatibility. `matching` holds lifecycle and evidence data. `errorMessage` must be safe for UI display and must not contain provider credentials, prompts, or raw provider output.

## Revision And Idempotency Model

Add a monotonically increasing `matchingProfileVersion` to the user profile. Increment it whenever resume keyword extraction succeeds or the user saves profile keywords. Add a per-job `matching.inputVersion` and `matching.requestedVersion`.

- Creating a job starts `inputVersion` and `requestedVersion` at `1`.
- Editing `title`, `description`, or `techStack` increments `inputVersion` and `requestedVersion` before enqueueing that job again.
- A bulk recalculation increments `requestedVersion` for every eligible job, even when the profile version has not changed.
- A queue message contains `jobId`, `userId`, `profileVersion`, `inputVersion`, and `requestedVersion`.
- Before saving a result, the worker reloads the job and profile. It saves only when all versions match the message; otherwise it exits successfully because newer work already superseded it.

Use a deterministic BullMQ job ID composed from these revisions, for example `job-match:<jobId>:<profileVersion>:<inputVersion>:<requestedVersion>`. The same requested work is therefore deduplicated, while a genuine rescore remains queueable.

Profile changes mark existing jobs as stale/pending but do not automatically enqueue the whole database in the first version. The user invokes the bulk recalculation endpoint after changing their profile. New jobs always use the latest profile version and are queued immediately.

## Staged Implementation

## Phase 1: Shared Contract And Product Documentation

- [x] Phase complete

References: [Product spec](PRODUCT_SPEC.md), [domain model](DOMAIN_MODEL.md), [API contract](API_CONTRACT.md), and [backend architecture](../backend/docs/ARCHITECTURE.md).

### Tasks

- Document backend-owned asynchronous matching on the Job Search and Jobs pages.
- Add the `matching` lifecycle/evidence field and `matchingProfileVersion` to the domain model.
- Add the recalculation endpoint and matching fields to the API contract.
- State that externally supplied import scores are temporary compatibility input and cannot be trusted as final scores.
- Define user-visible lifecycle wording for pending, processing, completed, failed, and stale results.

### Acceptance Criteria

- Product, domain, and API documents use the same field names and statuses.
- The existing `JobStatus` workflow is explicitly independent from match lifecycle.
- The documentation explains why a displayed score may be pending or stale after profile changes.

## Phase 2: Persistence And Repository Contracts

- [x] Phase complete

### Tasks

- Extend the user schema/domain/response with `matchingProfileVersion`.
- Extend the job schema/domain/response with the `matching` object while retaining `matchingScore` and `matchingReason`.
- Add repository methods to:
  - list non-deleted jobs for matching;
  - mark one job pending or processing with expected revisions;
  - save a completed result conditionally on expected revisions;
  - save a terminal failure conditionally on expected revisions;
  - increment matching versions when matching input fields change.
- Update `POST /users/profile/resume` and `POST /users/profile/keywords` to increment the profile version only after their existing successful writes.
- Decide and test a migration/default policy: existing users begin at profile version `1`; existing jobs are marked stale/pending without inventing a score.

### Acceptance Criteria

- Existing Mongo documents deserialize safely.
- A stale worker cannot overwrite a newer job edit, profile change, or recalculation request.
- No job workflow transition is changed by matching persistence.

## Phase 3: BullMQ And Redis Foundation

- [x] Phase complete

### Tasks

- Add BullMQ and Redis configuration to the backend and local development setup.
- Create a dedicated `job-matching` queue module, producer service, and separately bootstrapped worker process.
- Add environment configuration for Redis URL, worker concurrency, attempts, exponential retry delay, and completed/failed job retention.
- Configure safe defaults: bounded worker concurrency, three retry attempts for transient provider failures, and structured lifecycle logging with queue job ID, persisted job ID, and revisions.
- Ensure application shutdown closes queue, worker, and Redis connections cleanly.

### Acceptance Criteria

- A local worker can consume a fixture message without the HTTP server performing the work.
- Queue configuration is injectable and does not leak BullMQ into domain types or controllers.
- Queue messages contain only IDs and revisions, never the resume, full profile, or mutable job text.

## Phase 4: Matching Evaluator Port And Algorithm

- [x] Phase complete

### Tasks

- Define a `JobMatchingEvaluator` application port with typed input and a structured, validated result.
- Implement deterministic skill/title normalization, alias handling, evidence extraction, component-score calculation, final-score clamping, and guardrail caps.
- Add an AI-backed semantic evaluator implementation under the existing AI infrastructure. Require JSON output with component scores, matched skills, gaps, and posting evidence.
- Keep prompt construction deterministic and test it independently from the provider call.
- Provide a fixture evaluator for fast, deterministic use-case and worker tests.
- Set provider timeouts and output-size limits; classify parsing, validation, and provider failures as retryable or terminal deliberately.

### Acceptance Criteria

- The evaluator can score a job with only a description and title.
- Strong weighted skill coverage improves the result more than weak/historical keyword overlap.
- Isolated keyword presence cannot yield an inflated score.
- Every completed score has an explainable reason and structured evidence.

## Phase 5: Automatically Queue New And Changed Jobs

- [x] Phase complete

### Tasks

- Introduce a matching scheduling use case that durably records the repository state transition before queue enqueue. Do not claim a distributed MongoDB/Redis transaction; recover enqueue failures through the persisted failed state and bulk recalculation.
- Call it after each successfully created job from:
  - `POST /jobs/import` for both active and draft rows;
  - `POST /jobs` for manual jobs;
  - any future job-creation path.
- Do not schedule invalid import rows or jobs that failed persistence.
- On relevant job edits (`title`, `description`, `techStack`), increment matching input/request versions and queue that one job again.
- If Redis enqueue fails after persistence, retain `matching.status = 'failed'` with a safe scheduling error so a later bulk recalculation can recover it; never roll back a valid job import.

### Acceptance Criteria

- Each newly created job produces exactly one matching request for its current revisions.
- An import with multiple valid rows produces one message per persisted row, even when some rows are invalid.
- Matching failures do not turn an active job into a draft or fail an otherwise-valid import response.

## Phase 6: Worker And Recalculate-Everything Endpoint

- [x] Phase complete

### Tasks

- Implement the BullMQ processor: reload job and user profile, verify revisions, mark processing, evaluate, and conditionally persist the result.
- Process only non-deleted jobs owned by the queue message user. Treat missing/deleted jobs and superseded messages as successful no-ops.
- Implement `POST /jobs/matching/recalculate`.
- The endpoint resolves the default user, lists all non-deleted draft, active, and applied jobs, increments each `requestedVersion`, marks each pending, and enqueues one message per job.
- Return `202 Accepted` immediately; it must not wait for matching results.
- Return a compact enqueue summary so the user knows how many jobs were eligible, queued, deduplicated, or failed to enqueue.

### Suggested Response

```ts
type Response = {
  summary: {
    eligible: number;
    queued: number;
    alreadyQueued: number;
    failedToQueue: number;
  };
};
```

### Acceptance Criteria

- Recalculation adds one queue item for every eligible persisted job.
- A worker result is saved only if its exact profile, input, and request revisions are still current.
- A provider failure records a failed match state after retry exhaustion and does not crash the worker.

## Phase 7: Frontend Feedback

- [x] Phase complete

### Tasks

- Add a `Recalculate all matching scores` action where job-management controls already live.
- Show a non-blocking accepted/queued summary after the endpoint returns.
- Render the current score with compact lifecycle states: pending/stale, scoring, completed, or failed.
- Show the short matching reason and evidence details in the existing job-details drawer rather than adding a separate scoring page.
- Refresh job data while locally visible jobs are pending or processing, then stop polling when none remain active.

### Acceptance Criteria

- The UI never presents a pending, failed, or stale score as final.
- Users can see why a job scored as it did and trigger one bulk refresh without blocking normal job actions.
- Existing imported score columns continue to render using the same `matchingScore` field.

## Phase 8: Tests, Observability, And Rollout

- [x] Phase complete

### Backend Test Focus

- Queue one message per new manual and imported job.
- Do not queue invalid import rows or failed job writes.
- Bulk recalculation includes draft, active, and applied jobs but excludes soft-deleted jobs.
- Queue delivery is idempotent for the same revisions.
- Job and profile edits invalidate older worker messages.
- Weighted strong skills outrank weak/historical skills.
- Alias normalization, empty `techStack`, score caps, score bounds, and explanation validation behave deterministically.
- Provider retries and exhausted failures set the correct matching status without affecting job workflow status.

### Operational Tasks

- Add structured logs and metrics for queued, started, completed, superseded, retrying, and failed matching jobs.
- Include queue depth and oldest pending message age in local operational guidance.
- Add a dead-letter/retry procedure for persistent worker failures.
- Run a migration/backfill by calling the recalculation endpoint after deployment; do not write a one-off scoring script that bypasses the queue.
- Verify with fixture evaluator tests first, then one controlled real-provider smoke test. Ordinary verification remains lint/build/test; live app/browser testing is optional unless explicitly requested.

### Acceptance Criteria

- Failures are diagnosable by job ID and queue job ID without exposing profile or provider secrets.
- Existing jobs are backfilled through the same queue and worker path used by new jobs.
- The rollout can be paused by stopping workers without losing persisted jobs or their pending state.

## Explicit Non-Goals For The First Version

- No synchronous matching in import/create HTTP requests.
- No separate score-history collection or score timeline.
- No automatic whole-database rescore immediately after every profile edit; the explicit recalculation endpoint handles it.
- No fuzzy, black-box matching with no evidence or explanation.
- No change to duplicate detection, job workflow status, cover-letter rules, or application tracking.
