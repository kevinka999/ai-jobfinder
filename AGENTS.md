# Agent Instructions

## Project Summary

AI Jobfinder is a single-user MVP application for importing externally discovered job opportunities, detecting duplicates, generating temporary cover-letter drafts/PDFs, and tracking applications.

The repository is intentionally simple:

- `backend/`: NestJS REST API with MongoDB/Mongoose.
- `frontend/`: React and TypeScript app
- `docs/`: shared product, domain, API, and implementation documentation.

## Documentation Routing

Read only the documents and sections relevant to the current task.

- Product behavior and non-goals: `docs/PRODUCT_SPEC.md`
- Domain rules, persistence model, workflow rules, and ownership: `docs/DOMAIN_MODEL.md`
- Endpoint request/response shapes and HTTP behavior: `docs/API_CONTRACT.md`
- MVP build order and phase scope: `docs/IMPLEMENTATION_PLAN.md`

## App-Specific Work

When working under `backend/`, follow `backend/AGENTS.md` if present.

When working under `frontend/`, follow `frontend/AGENTS.md` if present.

Shared behavior belongs in the root `docs/` files. App-local architecture and implementation style belong inside the app folder.
