# Product Spec

## Overview

AI Jobfinder is a single-user MVP application that helps a user find job opportunities that match their resume, import structured job data, generate temporary cover letters, and track application progress.

The application does not scrape job platforms directly. Instead, it generates a deterministic prompt that the user can paste into an external AI agent with browsing/search tools. The user then pastes the returned JSON into this app. The app validates the imported jobs, detects possible duplicates, stores jobs, supports cover-letter generation, and tracks applications.

The MVP is single-user and has no login. The backend still stores `userId` on all collections so multi-user support can be added later.

## Technology Decisions

- Frontend: React, TypeScript, Vite.
- Backend: NestJS, REST API, MongoDB, Mongoose.
- Repository layout: same repository with separate `frontend/` and `backend/` directories.
- No formal monorepo tooling for MVP.
- No tRPC for MVP.
- No API version prefix such as `/api/v1`.
- No authentication for MVP.
- Backend uses one default user internally.
- All domain records still include `userId`.
- AI provider is accessed through an interface contract.
- OpenAI is the first concrete AI provider implementation.
- PDF generation is implemented in NestJS first.
- Generated PDFs are returned directly through the API as `application/pdf`.
- No S3, cloud file storage, or persistent PDF URLs for MVP.

## Core Principles

- Resume data is user-provided Markdown text.
- AI is used only for:
  - extracting resume job-title keywords and technical-skill keywords;
  - generating cover-letter drafts;
  - revising cover-letter drafts.
- AI is not used to generate the scraping prompt.
- Scraping prompts are deterministic backend text filled with stored user keywords and either search filters or specific job links.
- The app does not directly scrape LinkedIn, StepStone, Karriere, or Willhaben Jobs.
- Generated cover-letter drafts and PDFs are helper outputs only and are not stored.
- Job data is stored so the user can still inspect job descriptions after original postings disappear.

## Source Platforms

The MVP supports hardcoded source platform IDs in both frontend and backend:

```ts
[
  { id: "linkedin", label: "LinkedIn" },
  { id: "stepstone", label: "StepStone" },
  { id: "karriere", label: "Karriere" },
  { id: "willhaben", label: "Willhaben Jobs" },
  { id: "others", label: "Others" },
  { id: "manual", label: "Manual link" }
]
```

`sourcePlatformId` is stored on imported jobs. It is a string ID, not a display label.

`others` is used for imported jobs whose source does not match one of the hardcoded platform IDs.

`manual` is reserved for jobs the user creates manually inside the app.

## Page 1: User Profile

The User Profile page lets the user paste their technical resume and experience as Markdown text.

### User Actions

- Paste or edit resume Markdown.
- Save resume Markdown.
- Save reusable cover-letter instruction text.
- View extracted job-title keywords.
- View extracted technical-skill keywords.
- Add, delete, and save job-title keywords.
- Add, delete, weight, and save technical-skill keywords from `1` to `10`.

### Save Resume Behavior

When the user saves the resume:

1. Frontend sends the Markdown text to the backend.
2. Backend calls the AI provider to extract:
   - `jobTitleKeywords`;
   - `technicalSkillKeywords`.
3. If extraction succeeds, backend saves the resume Markdown and replaces the stored generated keywords.
4. Backend returns the updated profile.
5. If extraction fails, nothing is saved. The user must retry.

There is no Markdown validation for MVP beyond accepting text from the request.

Job-title keywords and technical-skill keywords can be saved separately from the resume. This does not call the AI provider and does not modify the resume Markdown.

Generated keyword text is still replaced every time the resume is saved successfully. After extraction, the user can manually add or delete keywords without re-saving the resume. Existing technical-skill weights are preserved for keywords that remain present after extraction; new technical-skill keywords start with weight `5`.

The user profile can store a cover-letter instruction template that prefills the cover-letter drawer's step-one instructions. It can be edited per generation and is saved separately from the resume.

The cover-letter structure/template is not editable in the user profile. Cover-letter structure and base instructions are hardcoded in the backend prompt.

The backend prompt should keep cover letters concise, practical, and evidence-backed. It should focus on two or three role-relevant capabilities, support them with resume examples, explain why the role or company fits the candidate's next step, and avoid generic company praise, unsupported adjective claims, full-stack inventories, or chronological resume repetition.

## Page 2: Job Search

The Job Search page helps the user prepare and import external AI search results.

### User Inputs

- Source platforms: multi-select from hardcoded options:
  - LinkedIn;
  - StepStone;
  - Karriere;
  - Willhaben Jobs.
- Cities: free-text multi-input.
- Work models: multi-select:
  - onsite;
  - hybrid;
  - remote.
- Job links: free-text textarea for one or more pasted posting URLs. This input is used only for the specific job links prompt.

### Generate Prompt Action

The user can generate either a broad search prompt or a prompt for specific job links.

For a broad search prompt, backend receives:

- selected `sourcePlatformIds`;
- selected cities;
- selected work models.

Backend loads the default user's stored keywords and fills a deterministic prompt template. The prompt instructs the external AI agent to search the selected platforms, locations, and work models, then scrape job details and return a JSON object with a `jobs` array.

Candidate matching is secondary metadata in the prompt. The prompt includes stored job-title keywords and technical-skill keywords grouped by saved weight into strong, moderate, and weak or historical bands. It instructs the external AI agent to score job fit from `0` to `100` based on evidence strength in the posting, not isolated keyword overlap.

For a specific job links prompt, backend receives one or more posting URLs. Backend loads the default user's stored keywords and fills a deterministic prompt template that instructs the external AI agent to scrape only those links, extract job details, use weighted profile signals for secondary matching fields, use `others` for direct employer links or unknown sources, and return the same `jobs` array shape.

The prompt must request the required import fields and may request optional enrichment fields.

### External AI Result Format

The external AI result must be pasted as a JSON object:

```json
{
  "jobs": [
    {
      "companyName": "Example GmbH",
      "title": "Frontend Developer",
      "applicationUrl": "https://example.com/jobs/123",
      "description": "Full job description...",
      "sourcePlatformId": "linkedin",
      "location": "Vienna",
      "workModel": "hybrid",
      "salaryText": "EUR 60,000 to EUR 75,000",
      "techStack": ["React", "TypeScript", "Node.js"],
      "matchingScore": 86,
      "matchingReason": "Strong match for React, TypeScript, Node.js, and frontend experience."
    }
  ]
}
```

### Import JSON Action

The user pastes JSON into the frontend.

Frontend behavior:

1. Parse the pasted JSON before submission.
2. If JSON syntax is invalid, show a client-side error.
3. If JSON is valid, send the parsed object to the backend.

Backend behavior:

1. Strictly validate the object and every `jobs[]` item.
2. Import valid job rows.
3. Skip invalid rows and return row-level errors.
4. Detect duplicates among valid rows.
5. Create each valid job as `active` or `draft`.
6. Return an import summary.

There is no duplicate-review modal during import.

### Import Status Behavior

Jobs have only one `status` field:

- `draft`;
- `active`;
- `applied`.

If an imported job does not match an existing active or applied job, it is created with `status = "active"`.

If an imported job matches an existing active or applied job by duplicate rules, it is created with `status = "draft"` and stores the existing possible duplicate job ID in:

```ts
metadata.possibleDuplicatedJobId
```

## Duplicate Detection

Duplicate detection is user-scoped. If a future second user imports the same job, it creates a separate job record for that user.

Duplicate detection compares new imported jobs only against the current user's existing jobs with:

- `status = "active"`;
- `status = "applied"`.

Existing draft jobs are ignored during duplicate detection.
Soft-deleted active jobs are still included during duplicate detection so re-imported deleted opportunities return as drafts.

An imported job becomes `draft` if either of these deterministic rules matches:

1. normalized `applicationUrl` matches an existing active or applied job;
2. normalized `companyName` plus normalized `title` matches an existing active or applied job.

No fuzzy matching, duplicate confidence, duplicate reason, or duplicate candidate array is needed for MVP.

## Page 3: Jobs To Apply

The Jobs page is the working area for reviewing imported jobs and applying to active jobs.

It has two main sections:

- Draft jobs table;
- Active jobs table.

Job rows can be marked as favorites with a star control. Favorite state belongs to the job and can be sorted so starred jobs appear first.

Applied jobs may remain visible as disabled/read-only rows for context, but the Applications page is the main place to manage them.

### Draft Jobs Table

Draft jobs are possible duplicates.

Draft jobs show enough information for the user to decide whether to keep or delete them. The table should also expose the possible duplicated job reference when `metadata.possibleDuplicatedJobId` exists, so the user can compare the imported draft with the existing job.

Draft job actions are intentionally limited:

- Keep;
- Delete.

Keep behavior:

- updates `job.status` from `draft` to `active`;
- the job becomes available in the active job workflow.

Delete behavior:

- hard-deletes the draft job.

Draft jobs cannot generate cover letters and cannot be marked as applied.

### Active Jobs Table

Active jobs are real opportunities in the user's job pool.

Active job row fields should include at minimum:

- company name;
- title;
- application URL;
- source platform;
- location if available;
- work model if available;
- matching score if available.

Active job actions:

- open details/edit drawer;
- generate cover letter;
- mark as applied;
- delete.

Active delete behavior:

- sets `deletedAt` instead of removing the job document;
- hides the job from normal Jobs page lists;
- keeps the job available for duplicate detection, so a future duplicate import is still created as a draft.

### Job Details/Edit Drawer

The details drawer preserves job information that may disappear from the source platform later.

It should show and allow editing of job fields such as:

- company name;
- title;
- application URL;
- source platform ID;
- description;
- location;
- work model;
- salary text;
- tech stack;
- matching score;
- matching reason;
- posted date;
- apply deadline;
- contact info;
- raw text.

Jobs can be edited from both:

- the Jobs page;
- the Applications page.

The Applications table also exposes the same job favorite star and can be sorted so favorited job applications appear first.

### Generate Cover Letter Flow

Cover-letter generation is only available for jobs with `status = "active"`.

The cover-letter drawer is a wizard.

Step 1: Instructions

- User can optionally provide job-specific instructions, topics, or personal angles.
- The textarea is prefilled from the saved cover-letter instruction template when present.
- The user can freely edit the prefilled text before each generation.
- Examples:
  - mention a specific technology;
  - emphasize local availability;
  - adjust tone;
  - focus on a particular qualification.

Step 2: Editable draft and revisions

- Backend generates a cover-letter draft using:
  - hardcoded cover-letter system/template prompt;
  - user's stored resume Markdown;
  - job details;
  - optional user instructions submitted from step 1.
- The generated draft is shown in an editable textarea.
- User can directly edit draft text before revising or generating the PDF.
- User can provide revision instructions.
- Backend revises the current draft text through the AI provider, including any manual edits.
- The user can repeat revision instructions as many times as needed.
- Example revision instruction:
  - `Change the word "a" to "b" in sentence X`.

Step 3: PDF generation

- User confirms the current draft.
- Frontend sends the final draft text to the backend.
- Backend generates a PDF in NestJS.
- Backend returns the PDF directly in the API response with `Content-Type: application/pdf`.
- Frontend downloads the returned PDF blob.

Generated cover-letter drafts and PDFs are not stored.

### Mark As Applied

Mark as applied is only available for jobs with `status = "active"`.

When the user marks a job as applied:

1. Backend sets `job.status = "applied"`.
2. Backend creates one application record if one does not already exist for that job.
3. New application status starts as `applied`.
4. The application `createdAt` timestamp is the applied date.
5. The job row becomes disabled/read-only in the Jobs page if still displayed.

## Page 4: Applications Tracking

The Applications page tracks jobs after the user has applied.

It displays applications joined with job details.

### Application Table Fields

The table should show:

- company name;
- job title;
- application URL;
- current application status;
- application created date;
- last updated date.

### Application Actions

The primary action is opening the application/job details drawer.

For applications still in `applied`, the table also provides quick actions to move the application to `interviewing` or `rejected`.

Inside the drawer, the user can:

- view job details;
- edit job details;
- edit root-level application notes;
- change application status;
- view application status history.

### Application Statuses

Application status starts as:

- `applied`.

It can move to:

- `interviewing`;
- `technical_test`;
- `offer`;
- `rejected`;
- `closed`.

When status changes:

- `applications.status` is updated;
- a new status history entry is appended;
- `updatedAt` is updated.

Status history entries do not store notes. Notes are only stored at the root of the application record.

## Non-Goals For MVP

- No user authentication.
- No multi-user UI.
- No direct scraping.
- No browser automation inside the app.
- No tRPC.
- No formal monorepo package/workspace setup.
- No API version prefix.
- No cover-letter persistence.
- No PDF persistence.
- No S3 or file storage.
- No separate keyword history or keyword extraction status UI.
- No editable cover-letter structure/template UI.
- No background job queue.
- No fuzzy duplicate matching.
- No duplicate review modal at import time.
