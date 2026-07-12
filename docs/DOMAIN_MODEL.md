# Domain Model

## Overview

The backend uses MongoDB with Mongoose collections.

The MVP collections are:

- `users`;
- `jobs`;
- `applications`.

There is no source-platform collection for MVP. Source platforms are hardcoded constants in frontend and backend.

Every persisted record includes `userId`, even though MVP has only one default internal user.

## User

The user document stores the user's resume Markdown, reusable cover-letter instruction prefill, and generated keyword data.

```ts
type User = {
  _id: string;
  resumeMarkdown: string;
  coverLetterInstructionTemplate: string;
  jobTitleKeywords: string[];
  technicalSkillKeywords: Array<{
    keyword: string;
    weight: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
};
```

### Fields

`_id`

MongoDB document ID. This is also the `userId` referenced by jobs and applications.

`resumeMarkdown`

Raw Markdown text pasted by the user. The app does not validate Markdown structure in MVP.

`coverLetterInstructionTemplate`

Reusable instruction text used to prefill step one of the cover-letter generator drawer. It can be edited freely for each generation and is saved separately from the resume and generated keywords.

`jobTitleKeywords`

AI-generated job-title keywords extracted from the resume. These are replaced every time the resume is saved successfully. After extraction, the user can manually add or delete job-title keywords without re-saving the resume.

Examples:

- Frontend Developer;
- Full Stack Developer;
- React Developer;
- Node.js Developer.

`technicalSkillKeywords`

AI-generated technical-skill keywords extracted from the resume, with a user-editable experience weight from `1` to `10`. After extraction, the user can manually add, delete, and weight technical-skill keywords without re-saving the resume.

The keyword text is replaced every time the resume is saved successfully. Existing weights are preserved for keywords that remain present after extraction; new technical-skill keywords start with weight `5`.

Manual keyword edits are stored separately from resume extraction workflow intent: the user can adjust keywords and weights without re-saving the resume or calling the AI provider.

Examples:

- `{ keyword: "NestJS", weight: 10 }`;
- `{ keyword: "Java", weight: 2 }`;
- `{ keyword: "React", weight: 9 }`;
- `{ keyword: "Docker", weight: 6 }`.

`createdAt`, `updatedAt`

Standard timestamps.

### User Rules

- MVP has one default user.
- No login or authentication.
- Saving a resume must also successfully extract keywords.
- If keyword extraction fails, the user document is not changed.
- Saving the cover-letter instruction template does not extract keywords or modify the resume.
- Saving profile keywords does not extract keywords or modify the resume.
- There is no stored cover-letter structure/template on the user document.

## Job

The job document stores imported or manually created job opportunities.

```ts
type Job = {
  _id: string;
  userId: string;
  companyName: string;
  title: string;
  applicationUrl: string;
  description: string;
  sourcePlatformId: SourcePlatformId;
  status: JobStatus;
  isFavorite: boolean;
  location?: string;
  workModel?: WorkModel;
  salaryText?: string;
  techStack?: string[];
  matchingScore?: number;
  matchingReason?: string;
  postedAt?: Date | string;
  applyDeadline?: Date | string;
  contactInfo?: string;
  rawText?: string;
  metadata?: JobMetadata;
  deletedAt?: Date | string;
  createdAt: Date;
  updatedAt: Date;
};
```

### JobStatus

```ts
type JobStatus = "draft" | "active" | "applied";
```

`draft`

The imported job may duplicate an existing active, soft-deleted active, or applied job. Draft jobs appear in the Drafts table. The only draft actions are keep and delete.

`active`

The job is part of the user's real job pool. Active jobs can be edited, used for cover-letter generation, and marked as applied.
When an active job is deleted, it is soft-deleted with `deletedAt` and hidden from normal job lists while remaining available for future duplicate detection.

`applied`

The user has applied to the job. Applying creates an application record. Applied jobs are managed primarily through the Applications page.

### SourcePlatformId

```ts
type SourcePlatformId =
  | "linkedin"
  | "stepstone"
  | "karriere"
  | "willhaben"
  | "others"
  | "manual";
```

The value is a hardcoded ID. It is not a source platform display label and is not stored in a separate collection for MVP.

`others` is used when an imported job source does not match any hardcoded source platform.

`manual` is reserved for jobs the user creates manually inside the app.

### WorkModel

```ts
type WorkModel = "onsite" | "hybrid" | "remote";
```

### JobMetadata

```ts
type JobMetadata = {
  possibleDuplicatedJobId?: string;
};
```

`possibleDuplicatedJobId`

Stores the existing active, soft-deleted active, or applied job ID that caused an imported job to become a draft. It exists so the user can compare the draft with the possible duplicate.

No duplicate reason, confidence, or duplicate candidate array is stored for MVP.

### Fields

`_id`

MongoDB document ID.

`userId`

Owner user ID. Duplicate detection and job listing are always user-scoped.

`companyName`

Company name from the job post.

`title`

Job title from the job post.

`applicationUrl`

URL where the user can inspect or apply for the job.

`description`

Stored job description. This is important because external job posts may disappear.

`sourcePlatformId`

Hardcoded platform ID where the job was found. Use `others` when the imported job source does not match any hardcoded source platform. Use `manual` only for jobs the user creates manually inside the app.

`status`

Current job workflow status: `draft`, `active`, or `applied`.

`isFavorite`

Boolean marker for jobs the user wants to prioritize. Favorites are job-level state, so the same value appears anywhere the job is shown, including Jobs and Applications tables. New imported and manually created jobs default to `false`.

`location`

Optional city or location text.

`workModel`

Optional work model: `onsite`, `hybrid`, or `remote`.

`salaryText`

Optional raw salary text.

`techStack`

Optional list of technologies from the external AI search result.

`matchingScore`

Optional numeric match score returned by the external AI search result.

`matchingReason`

Optional explanation for the match score.

`postedAt`

Optional posting date if discovered.

`applyDeadline`

Optional application deadline if discovered.

`contactInfo`

Optional contact or recruiter information if discovered.

`rawText`

Optional raw scraped/extracted text from the external AI result.

`metadata`

Typed optional metadata. For MVP it only contains `possibleDuplicatedJobId`.

`deletedAt`

Soft-delete timestamp. This is set only when the user deletes an active job. Soft-deleted active jobs are hidden from normal job lists and direct job reads, but they still participate in duplicate detection so re-imported duplicates become drafts.

`createdAt`, `updatedAt`

Standard timestamps.

### Duplicate Detection Rules

Duplicate detection runs during import.

It compares the imported job only against the current user's existing jobs with:

- `status = "active"`;
- `status = "applied"`.

Soft-deleted active jobs are still included in this comparison. Existing `draft` jobs are ignored.

An imported job becomes a draft if either rule matches:

1. normalized `applicationUrl` matches;
2. normalized `companyName` plus normalized `title` matches.

Otherwise the imported job becomes active.

### Normalization Rules

The implementation should normalize values before duplicate comparison.

Recommended URL normalization:

- trim whitespace;
- lowercase host;
- remove trailing slash;
- remove common tracking query parameters such as `utm_*` when practical.

Recommended company and title normalization:

- trim whitespace;
- lowercase;
- collapse repeated spaces;
- remove punctuation that does not change meaning when practical.

The app may compute normalization during import or store internal normalized helper fields for indexing. These helper fields do not need to be exposed in API responses.

### Job Workflow Rules

- Imported non-duplicates are created as `active`.
- Imported duplicates are created as `draft`.
- Draft keep changes `status` to `active`.
- Draft delete hard-deletes the document.
- Active delete sets `deletedAt` and hides the job from normal job lists.
- Active jobs can generate cover letters.
- Active jobs can be marked as applied.
- Draft jobs cannot generate cover letters.
- Draft jobs cannot be marked as applied.
- Applying changes the job status to `applied` and creates an application.

## Application

The application document tracks the user's application process after they apply to a job.

```ts
type Application = {
  _id: string;
  userId: string;
  jobId: string;
  status: ApplicationStatus;
  notes?: string;
  statusHistory: Array<{
    status: ApplicationStatus;
    changedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
};
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

`applied`

Initial status when the user marks an active job as applied.

`interviewing`

The user is in an interview process.

`technical_test`

The user is in a technical test or coding challenge stage.

`offer`

The user received an offer.

`rejected`

The company rejected the application.

`closed`

The process is closed for another reason, such as no response, user withdrew, or role closed.

### Fields

`_id`

MongoDB document ID.

`userId`

Owner user ID.

`jobId`

Associated job ID.

`status`

Current application status.

`notes`

Optional root-level application notes. This is where the user can store comments about the application.

`statusHistory`

Array of status changes. Each entry stores only:

- status;
- changedAt.

Status history entries do not store notes.

`createdAt`

Application creation time. This is also the applied date.

`updatedAt`

Last application update time.

### Application Workflow Rules

- Applications are created only by marking an active job as applied.
- Marking a job as applied sets the job's status to `applied`.
- A new application starts with `status = "applied"`.
- Initial `statusHistory` contains one `applied` entry.
- If application status changes, append a new history entry.
- If only notes change, do not append status history.
- Application notes are editable.
- Application status history is append-only from user actions.

## Cover Letter Domain

Cover letters are not stored in the database for MVP.

The cover-letter flow is a helper workflow:

1. Generate draft for an active job.
2. Show read-only draft in frontend state.
3. Revise by sending instructions to the AI provider.
4. Generate PDF from final draft text.
5. Return PDF directly through the API.

There is no `coverLetters` collection.

There is no stored generated draft.

There is no stored generated PDF.

There is no user-editable cover-letter structure/template in the database.

The cover-letter base structure/template is hardcoded in the backend prompt.

## AI Provider Domain

The backend should depend on an AI provider interface, not directly on OpenAI throughout the domain modules.

The first implementation is OpenAI.

Provider responsibilities:

- extract resume keywords;
- generate cover-letter drafts;
- revise cover-letter drafts.

The job-search prompt generator is not part of the AI provider. It is deterministic backend logic.

## Data Ownership And Isolation

All data is user-scoped.

For MVP there is one default user, but future multi-user support should be possible because:

- jobs contain `userId`;
- applications contain `userId`;
- duplicate detection filters by `userId`;
- job lists filter by `userId`;
- application lists filter by `userId`.

If a future second user imports the same job, that should create a separate job record for that user.
