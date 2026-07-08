# Backend Architecture

## Core Rules

- Controllers are thin HTTP adapters. They validate/map request data and call one use case.
- Use cases own application workflow. They coordinate domain rules, repositories, AI providers, PDF generation, and transactions when needed.
- Domain code is pure TypeScript. It must not import NestJS, Mongoose, HTTP clients, AI SDKs, or environment config.
- Infrastructure implements application ports and may import domain types for mapping/persistence. Use cases depend on interfaces/tokens, not concrete MongoDB, OpenAI, HTTP, or PDF classes.
- MongoDB schemas are persistence models, not domain models. Map documents to domain/application objects explicitly.
- Keep all persisted data user-scoped, even though MVP has one default internal user.
- Generated cover-letter drafts and PDFs are not stored for MVP.
- Job-search prompt generation is deterministic backend logic. It must not call the AI provider.

## Dependency Direction

Allowed direction:

```text
http/controller -> application/use-case -> domain
                         |
                         v
                 application/ports <- infrastructure
                                      -> domain
```

Allowed dependencies:

- HTTP controllers depend on application use cases.
- Use cases depend on domain code and application ports.
- Infrastructure depends on application ports and may depend on domain code for mapping.
- Nest modules wire concrete infrastructure providers to application tokens.

Forbidden: domain importing framework/infrastructure code, use cases importing concrete providers, repositories calling use cases, or providers owning workflow decisions.

## Source Shape

Keep this shape compact until the app grows:

```text
src/
  domain/
    users/
    jobs/
    applications/
    cover-letters/

  application/
    ports/
    use-cases/

  infrastructure/
    ai/
    database/
    pdf/
    config/

  http/
    controllers/
    dtos/

  app.module.ts
```

Layer meaning:

- `domain/` contains entities, value objects, and pure domain services.
- `application/use-cases/` contains one class per workflow, such as `SaveResumeUseCase` or `ImportJobsUseCase`.
- `application/ports/` contains contracts used by use cases.
- `infrastructure/` contains Nest providers that implement ports.
- `http/` contains controllers and DTOs. DTOs should match `API_CONTRACT.md`.

If a feature is tiny, avoid creating empty folders just to satisfy this sketch.

## Dependency Injection

Use Nest provider tokens for ports so implementations can be replaced without changing use cases.

```ts
export const USER_REPOSITORY = Symbol("USER_REPOSITORY");
export const JOB_REPOSITORY = Symbol("JOB_REPOSITORY");
export const APPLICATION_REPOSITORY = Symbol("APPLICATION_REPOSITORY");
export const AI_PROVIDER = Symbol("AI_PROVIDER");
export const PDF_RENDERER = Symbol("PDF_RENDERER");
```

Bind tokens to concrete providers inside infrastructure modules. Use cases inject tokens, not concrete classes.

## Application Ports

Start with only the contracts the use cases need:

- `UserRepository`: get/create default user, save resume and generated keywords.
- `JobRepository`: create, list, update editable fields, find duplicate candidates, change status, delete draft.
- `ApplicationRepository`: create/list/update applications and status history.
- `AiProvider`: extract resume keywords, generate cover-letter drafts, revise cover-letter drafts.
- `PdfRenderer`: render final cover-letter text to PDF bytes.

Do not create ports for deterministic logic that is internal to the app. For example, job-search prompt generation can be a normal application service/use case.

## Workflow Placement

- Save resume: use case calls `AiProvider.extractResumeKeywords`; persist nothing if extraction fails.
- Generate job-search prompt: use case loads stored keywords and fills a deterministic template; no AI call.
- Import jobs: use case validates rows, applies duplicate rules, creates `active` or `draft` jobs, and returns row-level errors.
- Keep draft: use case allows only `draft -> active`.
- Delete draft: use case allows hard delete only for `draft`.
- Apply to job: use case allows only active jobs, sets job to `applied`, and creates or returns the application.
- Cover-letter draft/revision: use case calls `AiProvider`; result is returned only.
- Cover-letter PDF: use case calls `PdfRenderer`; result is returned only.

## Naming

- Classes: `ImportJobsUseCase`, `MongoJobRepository`, `OpenAiProvider`.
- Every file name must be kebab-case, including controllers, DTOs, modules, schemas, repositories, use cases, and tests.
- Files: `import-jobs.use-case.ts`, `mongo-job.repository.ts`, `job-response.dto.ts`, `jobs.controller.ts`.
- Suffixes: `UseCase` for workflows, `Repository` for persistence, `Provider` for AI/third-party implementations.

## When To Update This File

Update this file when a backend architecture decision changes: source layout, dependency direction, DI/token rules, port boundaries, or infrastructure ownership. If only API behavior or domain fields change, update the shared docs instead.
