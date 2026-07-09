# Implementation Plan

## Purpose

This plan sequences the MVP implementation for AI Jobfinder based on the agreed product spec, [API contract](API_CONTRACT.md), [domain model](DOMAIN_MODEL.md), and [backend architecture](../backend/docs/ARCHITECTURE.md).

The goal is to build the useful workflow first:

1. save resume;
2. extract keywords;
3. generate search prompt;
4. import jobs;
5. review drafts;
6. manage active jobs;
7. generate cover-letter PDF;
8. mark jobs as applied;
9. track applications.

## Repo Structure

Use two top-level application directories:

```txt
frontend/
backend/
docs/
```

Do not add formal monorepo tooling for MVP.

## Phase 1: Backend Foundation

- [x] Phase complete

References: [backend source shape](../backend/docs/ARCHITECTURE.md#source-shape), [dependency direction](../backend/docs/ARCHITECTURE.md#dependency-direction), [naming rules](../backend/docs/ARCHITECTURE.md#naming), [API contract overview](API_CONTRACT.md#overview), [shared API types](API_CONTRACT.md#shared-types), [domain model overview](DOMAIN_MODEL.md#overview), and [data ownership rules](DOMAIN_MODEL.md#data-ownership-and-isolation).

### Tasks

- Scaffold NestJS app in `backend/`.
- Configure TypeScript, linting, formatting, and test runner according to NestJS defaults.
- Add MongoDB/Mongoose integration.
- Add environment configuration.
- Define default user resolution.
- Define hardcoded source platform constants.
- Add global validation pipe for DTO validation.
- Add CORS for local frontend development.

### Acceptance Criteria

- Backend runs locally.
- Backend connects to MongoDB.
- API can resolve or create the default user.
- Hardcoded platform IDs are available in backend code.
- No authentication is required.
- No `/api/v1` prefix is configured.

## Phase 2: Domain Schemas

- [x] Phase complete

References: [backend core rules](../backend/docs/ARCHITECTURE.md#core-rules), [backend source shape](../backend/docs/ARCHITECTURE.md#source-shape), [Domain model](DOMAIN_MODEL.md), and [shared API types](API_CONTRACT.md#shared-types).

### Tasks

- Create `users` Mongoose schema.
- Create `jobs` Mongoose schema.
- Create `applications` Mongoose schema.
- Add enums for job status, application status, source platform ID, and work model.
- Add typed `jobs.metadata.possibleDuplicatedJobId`.
- Add timestamps.
- Add indexes for user-scoped lookups.
- Add indexes or helpers for duplicate detection.

### Recommended Indexes

- `users`: `_id`.
- `jobs`: `{ userId: 1, status: 1 }`.
- `jobs`: `{ userId: 1, applicationUrl: 1 }`.
- `jobs`: optional normalized duplicate helper fields if persisted.
- `applications`: `{ userId: 1, status: 1 }`.
- `applications`: `{ userId: 1, jobId: 1 }`.

### Acceptance Criteria

- Schemas match [DOMAIN_MODEL.md](DOMAIN_MODEL.md).
- Jobs support `draft`, `active`, and `applied`.
- Applications support status history without notes.
- Generated cover letters are not represented in persistence.

## Phase 3: AI Provider Abstraction

- [x] Phase complete

References: [dependency injection](../backend/docs/ARCHITECTURE.md#dependency-injection), [application ports](../backend/docs/ARCHITECTURE.md#application-ports), [AI provider domain](DOMAIN_MODEL.md#ai-provider-domain), [AI provider contract](API_CONTRACT.md#ai-provider-contract), [user profile API](API_CONTRACT.md#user-profile-api), and [cover letter API](API_CONTRACT.md#cover-letter-api).

### Tasks

- Define `AiProvider` interface contract.
- Implement OpenAI provider.
- Add provider injection token.
- Add prompt for resume keyword extraction.
- Add prompt for cover-letter generation.
- Add prompt for cover-letter revision.
- Ensure keyword extraction returns structured arrays.

### Acceptance Criteria

- Use cases depend on the provider interface, not OpenAI directly.
- OpenAI implementation is the only implementation wired for MVP.
- Keyword extraction returns `jobTitleKeywords` and `technicalSkillKeywords`.
- Cover-letter methods return `draftMarkdown`.

## Phase 4: User Profile API

- [x] Phase complete

References: [workflow placement](../backend/docs/ARCHITECTURE.md#workflow-placement), [User profile API](API_CONTRACT.md#user-profile-api), [User domain](DOMAIN_MODEL.md#user), and [AI provider domain](DOMAIN_MODEL.md#ai-provider-domain).

### Tasks

- Implement `GET /users/profile`.
- Implement `POST /users/profile/resume`.
- On resume save, call keyword extraction first.
- Save resume and generated keywords only after extraction succeeds.
- Return updated profile.
- If extraction fails, return an error and do not persist changes.

### Acceptance Criteria

- User can load profile.
- User can save resume Markdown.
- Keywords regenerate and replace previous keywords on successful save.
- Failed extraction leaves previous profile unchanged.
- No keyword extraction status is stored.

## Phase 5: Job Search Prompt API

- [x] Phase complete

References: [workflow placement](../backend/docs/ARCHITECTURE.md#workflow-placement), [Job search prompt API](API_CONTRACT.md#job-search-prompt-api), [User domain](DOMAIN_MODEL.md#user), [SourcePlatformId](DOMAIN_MODEL.md#sourceplatformid), and [WorkModel](DOMAIN_MODEL.md#workmodel).

### Tasks

- Implement `POST /job-search/prompt`.
- Validate selected source platform IDs.
- Validate selected work models.
- Accept free-text cities.
- Load stored user keywords.
- Fill deterministic prompt template.
- Include expected JSON object wrapper with `jobs` array.
- Include required and optional job fields in the prompt.

### Acceptance Criteria

- Endpoint does not call AI.
- Prompt includes selected platforms, cities, work models, job-title keywords, technical-skill keywords, and import schema.
- Prompt instructs external AI to return JSON only.

## Phase 6: Job Import API

- [x] Phase complete

References: [workflow placement](../backend/docs/ARCHITECTURE.md#workflow-placement), [Job import API](API_CONTRACT.md#job-import-api), [Job domain](DOMAIN_MODEL.md#job), and [duplicate detection rules](DOMAIN_MODEL.md#duplicate-detection-rules).

### Tasks

- Implement strict DTO validation for `{ jobs: JobImportItem[] }`.
- Support required fields:
  - `companyName`;
  - `title`;
  - `applicationUrl`;
  - `description`;
  - `sourcePlatformId`.
- Support optional enrichment fields:
  - `location`;
  - `workModel`;
  - `salaryText`;
  - `techStack`;
  - `matchingScore`;
  - `matchingReason`;
  - `postedAt`;
  - `applyDeadline`;
  - `contactInfo`;
  - `rawText`.
- Implement row-level validation errors.
- Import valid rows even if other rows are invalid.
- Implement duplicate detection against current user's active and applied jobs.
- Ignore existing draft jobs in duplicate detection.
- Store duplicates as `draft`.
- Store non-duplicates as `active`.
- Store `metadata.possibleDuplicatedJobId` for draft duplicate imports.

### Acceptance Criteria

- Frontend can send parsed JSON object.
- Backend validates each row.
- Invalid rows are skipped and returned.
- Valid rows are persisted.
- Duplicate rows become draft.
- Non-duplicates become active.
- Import response includes active jobs, draft jobs, invalid rows, and summary counts.

## Phase 7: Jobs API

- [x] Phase complete

References: [workflow placement](../backend/docs/ARCHITECTURE.md#workflow-placement), [Jobs API](API_CONTRACT.md#jobs-api), [Job domain](DOMAIN_MODEL.md#job), [job workflow rules](DOMAIN_MODEL.md#job-workflow-rules), and [Application domain](DOMAIN_MODEL.md#application).

### Tasks

- Implement `GET /jobs`.
- Implement `GET /jobs/:jobId`.
- Implement `POST /jobs` for manual job creation.
- Implement `PATCH /jobs/:jobId` for editable job fields.
- Implement `POST /jobs/:jobId/keep` for draft keep.
- Implement `DELETE /jobs/:jobId` for draft hard delete.
- Implement `POST /jobs/:jobId/apply`.

### Acceptance Criteria

- Jobs are always filtered by default user.
- Draft keep changes status to active.
- Draft delete hard-deletes the job.
- Mark as applied is allowed only for active jobs.
- Mark as applied sets job status to applied.
- Mark as applied creates one application record.
- Updating job details does not accidentally change workflow status.

## Phase 8: Applications API

- [x] Phase complete

References: [workflow placement](../backend/docs/ARCHITECTURE.md#workflow-placement), [Applications API](API_CONTRACT.md#applications-api), [Application domain](DOMAIN_MODEL.md#application), and [application workflow rules](DOMAIN_MODEL.md#application-workflow-rules).

### Tasks

- Implement `GET /applications`.
- Implement `GET /applications/:applicationId`.
- Implement `PATCH /applications/:applicationId`.
- Join or populate job details for application responses.
- Support updating root-level `notes`.
- Support updating `status`.
- Append status history entry only when status changes.

### Acceptance Criteria

- Applications list shows job details.
- Application notes can be edited.
- Application status can be changed.
- Status changes append `{ status, changedAt }`.
- Status history entries do not contain notes.
- `createdAt` acts as applied date.

## Phase 9: Cover Letter And PDF API

- [x] Phase complete

References: [application ports](../backend/docs/ARCHITECTURE.md#application-ports), [workflow placement](../backend/docs/ARCHITECTURE.md#workflow-placement), [Cover letter API](API_CONTRACT.md#cover-letter-api), [cover letter domain](DOMAIN_MODEL.md#cover-letter-domain), [AI provider domain](DOMAIN_MODEL.md#ai-provider-domain), and [job workflow rules](DOMAIN_MODEL.md#job-workflow-rules).

### Tasks

- Implement `POST /cover-letters/draft`.
- Implement `POST /cover-letters/revise`.
- Implement `POST /cover-letters/pdf`.
- Enforce active-job-only rule.
- Load user resume and job details for draft/revision generation.
- Use hardcoded backend cover-letter structure/template prompt.
- Accept optional user instructions for first draft.
- Accept revision instructions for revisions.
- Keep generated text stateless.
- Generate PDF in NestJS.
- Return PDF directly as `application/pdf`.

### Acceptance Criteria

- Cover-letter generation works only for active jobs.
- Draft output is returned as Markdown/text and not stored.
- Revision output is returned as Markdown/text and not stored.
- PDF endpoint returns a file response.
- No cover-letter collection exists.
- No PDF is stored.

## Phase 10: Frontend Foundation

- [x] Phase complete

References: [API contract overview](API_CONTRACT.md#overview), [shared API types](API_CONTRACT.md#shared-types), and [data ownership rules](DOMAIN_MODEL.md#data-ownership-and-isolation).

### Tasks

- Scaffold React, TypeScript, Vite app in `frontend/`.
- Add routing.
- Add API client wrapper.
- Add layout/navigation for four pages:
  - User Profile;
  - Job Search;
  - Jobs;
  - Applications.
- Add common components:
  - table;
  - drawer;
  - form fields;
  - multi-select;
  - textarea;
  - status badges;
  - loading/error states.

### Acceptance Criteria

- Frontend runs locally.
- Navigation works.
- API base URL is configurable.
- UI is workflow-first, not a marketing landing page.

## Phase 11: User Profile Frontend

- [x] Phase complete

References: [User profile API](API_CONTRACT.md#user-profile-api) and [User domain](DOMAIN_MODEL.md#user).

### Tasks

- Build resume Markdown textarea.
- Build save action.
- Build cover-letter instruction template textarea with a separate save action.
- Show extracted job-title keywords.
- Show extracted technical-skill keywords.
- Handle extraction/save loading state.
- Handle extraction failure as a save failure.

### Acceptance Criteria

- User can paste and save Markdown.
- Keywords update after successful save.
- Failed save leaves UI clear that nothing changed.

## Phase 12: Job Search Frontend

- [x] Phase complete

References: [Job search prompt API](API_CONTRACT.md#job-search-prompt-api), [job import API](API_CONTRACT.md#job-import-api), and [duplicate detection rules](DOMAIN_MODEL.md#duplicate-detection-rules).

### Tasks

- Build source platform multi-select.
- Build city free-text multi-input.
- Build work model multi-select.
- Call prompt generation endpoint.
- Show generated prompt with copy affordance.
- Build pasted JSON textarea.
- Parse JSON client-side.
- Show client syntax errors.
- Submit parsed object to import endpoint.
- Show import summary.
- Show invalid row errors when present.

### Acceptance Criteria

- User can generate a prompt.
- User can paste external AI JSON.
- Invalid JSON is caught before API call.
- Valid JSON is submitted.
- Import results are understandable.

## Phase 13: Jobs Frontend

- [x] Phase complete

References: [Jobs API](API_CONTRACT.md#jobs-api), [cover letter API](API_CONTRACT.md#cover-letter-api), and [job workflow rules](DOMAIN_MODEL.md#job-workflow-rules).

### Tasks

- Build Draft jobs table.
- Build Active jobs table.
- Optionally show applied jobs as disabled/read-only rows.
- Show possible duplicate reference for draft jobs.
- Implement draft keep.
- Implement draft delete.
- Build job details/edit drawer for active/applied jobs.
- Implement generate cover letter drawer wizard.
- Implement mark as applied.

### Acceptance Criteria

- Draft jobs have only keep and delete mutating actions.
- Keeping a draft moves it to active.
- Deleting a draft removes it.
- Active jobs can be edited.
- Active jobs can generate cover letters.
- Active jobs can be marked as applied.
- Applied jobs no longer allow active-only actions.

## Phase 14: Cover Letter Frontend

- [x] Phase complete

References: [Cover letter API](API_CONTRACT.md#cover-letter-api) and [cover letter domain](DOMAIN_MODEL.md#cover-letter-domain).

### Tasks

- Build cover-letter wizard drawer.
- Step 1 accepts optional instructions prefilled from the saved instruction template.
- Step 2 shows read-only draft.
- Step 2 accepts revision instructions.
- Allow repeated revisions.
- Step 3 calls PDF endpoint.
- Download returned PDF blob.

### Acceptance Criteria

- Draft text is read-only.
- User can revise only through instructions.
- PDF downloads successfully.
- Generated draft and PDF are not stored in frontend beyond current session state.

## Phase 15: Applications Frontend

- [x] Phase complete

References: [Applications API](API_CONTRACT.md#applications-api), [Jobs API](API_CONTRACT.md#jobs-api), and [Application domain](DOMAIN_MODEL.md#application).

### Tasks

- Build applications table.
- Build details drawer.
- Show job details.
- Allow job detail editing.
- Allow application notes editing.
- Allow application status updates.
- Show status history.

### Acceptance Criteria

- Applications are listed with job details.
- Status updates persist and append history.
- Notes update without adding history entries.
- Job details can be edited from Applications page.

## Phase 16: Tests And Verification

- [x] Phase complete

References: [backend architecture](../backend/docs/ARCHITECTURE.md), [API contract](API_CONTRACT.md), and [domain model](DOMAIN_MODEL.md).

### Backend Test Focus

- Resume save succeeds only when AI extraction succeeds.
- Import validates required fields.
- Import supports partial success.
- Duplicate detection produces draft jobs.
- Non-duplicates produce active jobs.
- Draft keep changes status to active.
- Draft delete hard-deletes.
- Apply creates application and changes job status.
- Application status change appends history.
- Cover-letter endpoints reject non-active jobs.

### Frontend Test Focus

- JSON parsing error state.
- Prompt generation state.
- Import summary rendering.
- Draft keep/delete flows.
- Active job actions.
- Cover-letter wizard steps.
- PDF download handling.
- Application status update.

## Implementation Notes

- Keep DTOs explicit in the backend.
- Keep backend implementation aligned with [backend architecture](../backend/docs/ARCHITECTURE.md).
- Do not build auth until the core workflow works.
- Do not add tRPC.
- Do not add `/api/v1`.
- Do not persist cover-letter drafts or PDFs.
- Do not add source platform persistence yet.
- Do not add keyword editing yet.
- Do not add fuzzy duplicate matching yet.
- Keep frontend tables dense, clear, and workflow-focused.
- Prefer predictable forms, drawers, tables, status badges, and compact controls.
