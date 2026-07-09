# API Contract

## Overview

The backend is a NestJS REST API with MongoDB/Mongoose persistence.

The MVP has no login. Every endpoint resolves the same internal default user. All persisted collections still include `userId`.

Unless otherwise stated:

- request and response bodies are JSON;
- IDs are strings;
- timestamps are ISO 8601 strings;
- generated cover-letter PDFs are returned as `application/pdf`;
- validation errors should use standard HTTP error responses;
- row-level import errors are returned in the import response instead of failing the whole request.

## Shared Types

### SourcePlatformId

```ts
type SourcePlatformId =
  | "linkedin"
  | "stepstone"
  | "karriere"
  | "willhaben"
  | "manual";
```

The IDs are hardcoded in frontend and backend for MVP.

`manual` is used for self-found posting URLs that do not belong to one of the searchable job platforms.

### WorkModel

```ts
type WorkModel = "onsite" | "hybrid" | "remote";
```

### JobStatus

```ts
type JobStatus = "draft" | "active" | "applied";
```

### ApplicationStatus

```ts
type ApplicationStatus =
  | "applied"
  | "interviewing"
  | "technical_test"
  | "offer"
  | "rejected"
  | "closed";
```

### UserProfileResponse

```ts
type UserProfileResponse = {
  id: string;
  resumeMarkdown: string;
  coverLetterInstructionTemplate: string;
  jobTitleKeywords: string[];
  technicalSkillKeywords: string[];
  createdAt: string;
  updatedAt: string;
};
```

### JobResponse

```ts
type JobResponse = {
  id: string;
  userId: string;
  companyName: string;
  title: string;
  applicationUrl: string;
  description: string;
  sourcePlatformId: SourcePlatformId;
  status: JobStatus;
  location?: string;
  workModel?: WorkModel;
  salaryText?: string;
  techStack?: string[];
  matchingScore?: number;
  matchingReason?: string;
  postedAt?: string;
  applyDeadline?: string;
  contactInfo?: string;
  rawText?: string;
  metadata?: {
    possibleDuplicatedJobId?: string;
  };
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
};
```

### ApplicationResponse

```ts
type ApplicationResponse = {
  id: string;
  userId: string;
  jobId: string;
  job?: JobResponse;
  status: ApplicationStatus;
  notes?: string;
  statusHistory: Array<{
    status: ApplicationStatus;
    changedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};
```

## User Profile API

### GET /users/profile

Returns the default user's profile.

#### Response

```ts
type Response = UserProfileResponse;
```

If the default user does not exist yet, the backend should create or return an empty default profile.

### POST /users/profile/resume

Saves the user's resume Markdown and regenerates keywords synchronously.

The backend must:

1. receive Markdown text;
2. call the injected AI provider to extract `jobTitleKeywords` and `technicalSkillKeywords`;
3. if extraction succeeds, save resume Markdown and replace old generated keywords;
4. return the updated profile;
5. if extraction fails, save nothing and return an error.

There is no separate `keywordExtractionStatus` field.

#### Request

```ts
type Request = {
  resumeMarkdown: string;
};
```

#### Response

```ts
type Response = UserProfileResponse;
```

#### Failure Behavior

If AI extraction fails, the request fails and no profile data is changed. The user retries until extraction and persistence both work.

### POST /users/profile/cover-letter-instruction-template

Saves the user's reusable cover-letter instruction text separately from the resume.

This field is a prefill for the cover-letter drawer's step-one instructions textarea. The user can freely edit the textarea for each cover-letter generation. This is not the cover-letter structure/template; the backend cover-letter structure remains hardcoded in the AI prompt.

#### Request

```ts
type Request = {
  coverLetterInstructionTemplate: string;
};
```

#### Response

```ts
type Response = UserProfileResponse;
```

## Job Search Prompt API

### POST /job-search/prompt

Returns a deterministic prompt string to paste into an external AI agent with browsing/search tools.

This endpoint does not call AI.

The backend must:

1. load the default user's stored job-title and technical-skill keywords;
2. validate selected platform IDs, cities, and work models;
3. fill a hardcoded prompt template;
4. include the required JSON result shape;
5. return the prompt string.

#### Request

```ts
type Request = {
  sourcePlatformIds: SourcePlatformId[];
  cities: string[];
  workModels: WorkModel[];
};
```

#### Response

```ts
type Response = {
  prompt: string;
};
```

#### Prompt Requirements

The generated prompt should instruct the external AI agent to:

- search only the selected source platforms;
- search in the selected cities;
- respect selected work models;
- use the user's generated job-title keywords;
- use the user's generated technical-skill keywords;
- find jobs that match the user's qualifications;
- include application links;
- include job descriptions;
- include matching score and matching reason when possible;
- return only valid JSON using the object wrapper shape:

```json
{
  "jobs": []
}
```

The prompt should include a compact JSON Schema for the external AI response instead of relying only on prose field lists. The schema should describe:

- the required top-level `jobs` array;
- required job fields;
- optional enrichment fields;
- selected `sourcePlatformId` values as an enum;
- selected `workModel` values as an enum;
- `additionalProperties: false` for the top-level object and each job item.

### POST /job-search/links/prompt

Returns a deterministic prompt string to paste into an external AI agent with browsing/scraping tools for specific job posting URLs.

This endpoint does not call AI.

The backend must:

1. load the default user's stored job-title and technical-skill keywords;
2. validate one or more posting URLs;
3. fill a hardcoded prompt template;
4. include the required JSON result shape;
5. return the prompt string.

#### Request

```ts
type Request = {
  jobLinks: string[];
};
```

#### Response

```ts
type Response = {
  prompt: string;
};
```

#### Prompt Requirements

The generated prompt should instruct the external AI agent to:

- scrape only the provided job links;
- not search for additional jobs;
- use the user's generated job-title keywords;
- use the user's generated technical-skill keywords;
- include application links;
- include job descriptions;
- use `manual` as `sourcePlatformId` for direct employer links or non-platform posting URLs;
- include matching score and matching reason when possible;
- return only valid JSON using the object wrapper shape:

```json
{
  "jobs": []
}
```

The prompt should include the same compact JSON Schema used by the search prompt, except `sourcePlatformId` may use any hardcoded source platform ID, including `manual`, and `workModel` may use any supported work model.

## Job Import API

### POST /jobs/import

Imports valid jobs from pasted external AI JSON.

Frontend parses pasted JSON before calling this endpoint. Backend receives a JSON object and performs strict schema validation.

#### Request

```ts
type Request = {
  jobs: JobImportItem[];
};
```

#### JobImportItem

Required fields:

```ts
type JobImportItemRequired = {
  companyName: string;
  title: string;
  applicationUrl: string;
  description: string;
  sourcePlatformId: SourcePlatformId;
};
```

Optional enrichment fields:

```ts
type JobImportItemOptional = {
  location?: string;
  workModel?: WorkModel;
  salaryText?: string;
  techStack?: string[];
  matchingScore?: number;
  matchingReason?: string;
  postedAt?: string;
  applyDeadline?: string;
  contactInfo?: string;
  rawText?: string;
};
```

Full item:

```ts
type JobImportItem = JobImportItemRequired & JobImportItemOptional;
```

#### Import Behavior

For each valid job row:

1. Compare against current user's existing jobs with `status = "active"` or `status = "applied"`, including soft-deleted active jobs.
2. If normalized `applicationUrl` matches, import as `draft`.
3. If normalized `companyName + title` matches, import as `draft`.
4. If no duplicate match exists, import as `active`.
5. If imported as `draft`, set `metadata.possibleDuplicatedJobId` to the matched existing job ID.

Existing draft jobs are ignored during duplicate detection.

Invalid rows are skipped and returned as row errors.

#### Response

```ts
type Response = {
  createdActiveJobs: JobResponse[];
  createdDraftJobs: JobResponse[];
  invalidRows: Array<{
    index: number;
    errors: string[];
    value: unknown;
  }>;
  summary: {
    received: number;
    createdActive: number;
    createdDraft: number;
    invalid: number;
  };
};
```

The endpoint should not open or require a duplicate-review modal. Drafts are reviewed later on the Jobs page.

## Jobs API

### GET /jobs

Lists the default user's jobs.

#### Query

```ts
type Query = {
  status?: JobStatus;
};
```

If `status` is provided, only non-deleted jobs with that status are returned. If omitted, all non-deleted jobs for the default user are returned.

#### Response

```ts
type Response = JobResponse[];
```

### GET /jobs/:jobId

Returns one non-deleted job for the default user.

#### Response

```ts
type Response = JobResponse;
```

### POST /jobs

Manually creates a job.

Manual create uses the same required fields as import. Unless otherwise specified, manually created jobs start as `active`.

#### Request

```ts
type Request = {
  companyName: string;
  title: string;
  applicationUrl: string;
  description: string;
  sourcePlatformId: SourcePlatformId;
  location?: string;
  workModel?: WorkModel;
  salaryText?: string;
  techStack?: string[];
  matchingScore?: number;
  matchingReason?: string;
  postedAt?: string;
  applyDeadline?: string;
  contactInfo?: string;
  rawText?: string;
};
```

#### Response

```ts
type Response = JobResponse;
```

### PATCH /jobs/:jobId

Updates editable job fields.

This endpoint is used by both:

- Jobs page details/edit drawer;
- Applications page job details/edit drawer.

It should not directly change status except through dedicated workflow endpoints.

#### Request

```ts
type Request = Partial<{
  companyName: string;
  title: string;
  applicationUrl: string;
  description: string;
  sourcePlatformId: SourcePlatformId;
  location: string;
  workModel: WorkModel;
  salaryText: string;
  techStack: string[];
  matchingScore: number;
  matchingReason: string;
  postedAt: string;
  applyDeadline: string;
  contactInfo: string;
  rawText: string;
}>;
```

#### Response

```ts
type Response = JobResponse;
```

### POST /jobs/:jobId/keep

Keeps a draft job by changing it to active.

Allowed only when `job.status = "draft"`.

#### Response

```ts
type Response = JobResponse;
```

### DELETE /jobs/:jobId

Deletes a job for the default user.

Allowed when:

- `job.status = "draft"`: hard-deletes the draft import.
- `job.status = "active"`: soft-deletes the active job by setting `deletedAt`.

Soft-deleted active jobs are hidden from normal job list and direct read endpoints, but they remain available to duplicate detection. If a later import duplicates a soft-deleted active job, the imported row is still created as `draft` with `metadata.possibleDuplicatedJobId`.

Applied jobs cannot be deleted by this endpoint.

#### Response

```ts
type Response = {
  deleted: true;
};
```

### POST /jobs/:jobId/apply

Marks an active job as applied and creates an application record.

Allowed only when `job.status = "active"`.

The backend must:

1. set `job.status = "applied"`;
2. create one application record if one does not already exist for this job;
3. initialize application status as `applied`;
4. initialize `statusHistory` with one `applied` entry;
5. return the created or existing application with job details.

#### Response

```ts
type Response = ApplicationResponse;
```

## Applications API

### GET /applications

Lists applications for the default user, joined with job details.

#### Query

```ts
type Query = {
  status?: ApplicationStatus;
};
```

#### Response

```ts
type Response = ApplicationResponse[];
```

### GET /applications/:applicationId

Returns one application with job details.

#### Response

```ts
type Response = ApplicationResponse;
```

### PATCH /applications/:applicationId

Updates application tracking fields.

Editable fields:

- `status`;
- `notes`.

If `status` changes:

- update `applications.status`;
- append a new `statusHistory` entry with the new status and current timestamp;
- update `updatedAt`.

Status history entries do not store notes.

#### Request

```ts
type Request = Partial<{
  status: ApplicationStatus;
  notes: string;
}>;
```

#### Response

```ts
type Response = ApplicationResponse;
```

## Cover Letter API

Generated cover-letter drafts and PDFs are not stored.

Cover-letter endpoints are stateless except that they read the default user's resume and the selected job.

The frontend may prefill `userInstructions` from `coverLetterInstructionTemplate`, but the draft endpoint only receives the final per-generation instructions submitted by the user.

Cover-letter actions are allowed only for jobs with `status = "active"`.

### POST /cover-letters/draft

Generates the first cover-letter draft.

The backend must:

1. load the active job;
2. load the default user's resume Markdown;
3. call the injected AI provider;
4. use the hardcoded backend cover-letter structure/template prompt;
5. include optional user instructions;
6. return read-only draft Markdown.

#### Request

```ts
type Request = {
  jobId: string;
  userInstructions?: string;
};
```

#### Response

```ts
type Response = {
  draftMarkdown: string;
};
```

### POST /cover-letters/revise

Revises the current cover-letter draft using user instructions.

The draft remains read-only in the frontend. The user modifies it only by sending revision instructions.

#### Request

```ts
type Request = {
  jobId: string;
  currentDraftMarkdown: string;
  revisionInstructions: string;
};
```

#### Response

```ts
type Response = {
  draftMarkdown: string;
};
```

### POST /cover-letters/pdf

Generates a cover-letter PDF from the final draft text and returns it directly through the API.

The backend does not store the PDF.

#### Request

```ts
type Request = {
  jobId: string;
  finalDraftMarkdown: string;
};
```

#### Response

Binary PDF response.

Headers:

```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="cover-letter-company-role.pdf"
```

Frontend should receive the response as a Blob and trigger a browser download.

## AI Provider Contract

The backend must define an interface contract for AI providers and inject the OpenAI implementation for MVP.

```ts
export interface AiProvider {
  extractResumeKeywords(input: {
    resumeMarkdown: string;
  }): Promise<{
    jobTitleKeywords: string[];
    technicalSkillKeywords: string[];
  }>;

  generateCoverLetterDraft(input: {
    resumeMarkdown: string;
    job: {
      companyName: string;
      title: string;
      description: string;
      applicationUrl: string;
      location?: string;
      workModel?: WorkModel;
      salaryText?: string;
      techStack?: string[];
      matchingScore?: number;
      matchingReason?: string;
    };
    userInstructions?: string;
  }): Promise<{
    draftMarkdown: string;
  }>;

  reviseCoverLetterDraft(input: {
    resumeMarkdown: string;
    job: {
      companyName: string;
      title: string;
      description: string;
      applicationUrl: string;
      location?: string;
      workModel?: WorkModel;
      salaryText?: string;
      techStack?: string[];
    };
    currentDraftMarkdown: string;
    revisionInstructions: string;
  }): Promise<{
    draftMarkdown: string;
  }>;
}
```

## Validation Rules

### Resume

- Accept text.
- No Markdown validation for MVP.
- Resume is saved only if keyword extraction succeeds.

### Job Import

Required fields:

- `companyName`;
- `title`;
- `applicationUrl`;
- `description`;
- `sourcePlatformId`.

Optional fields:

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

Invalid import rows are skipped and returned as row-level errors.

### Workflow Constraints

- Draft jobs can only be kept or deleted.
- Keep changes a draft job to active.
- Delete hard-deletes a draft job.
- Delete soft-deletes an active job.
- Cover letters can be generated only for active jobs.
- Mark as applied is allowed only for active jobs.
- Applying creates an application record and sets job status to applied.
- Application status changes append status history entries.
