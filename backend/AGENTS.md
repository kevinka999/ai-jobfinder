# Backend Agent Instructions

## Backend Scope

This folder contains the NestJS REST API for AI Jobfinder.

The backend should follow a pragmatic Clean Architecture design: HTTP, application workflow, domain rules, and infrastructure concerns should stay separated according to `docs/ARCHITECTURE.md`.

## Progressive Disclosure

Read only the documents and sections relevant to the current task.

- Backend architecture index and decisions: `docs/ARCHITECTURE.md`
- API request/response shapes and HTTP behavior: `../docs/API_CONTRACT.md`
- Domain rules, persistence model, workflow rules, and ownership: `../docs/DOMAIN_MODEL.md`
- Product behavior and MVP non-goals: `../docs/PRODUCT_SPEC.md`
- Implementation phase scope: `../docs/IMPLEMENTATION_PLAN.md`

## Documentation Rules

- If API behavior or response/request shapes change, update `../docs/API_CONTRACT.md`.
- If domain rules or persistence behavior change, update `../docs/DOMAIN_MODEL.md`.
- If backend architecture decisions change, update `docs/ARCHITECTURE.md`.
