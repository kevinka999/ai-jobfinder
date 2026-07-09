# Frontend Design System

## Purpose

This app is a private, workflow-heavy job application tool. The interface should feel quiet, dense, and predictable: prioritize scanning tables, editing forms, and moving through application states without decorative noise.

## Token Source

Design tokens live in `src/design/tokens.css` and are exposed through Tailwind utilities.

- Use `app-*` tokens for neutral app structure: `bg-app-bg`, `bg-app-surface`, `border-app-border`, `text-app-text`, and `text-app-text-muted`.
- Use `brand-*` for primary actions, active navigation, focus, and positive workflow emphasis.
- Use `accent-*` only for applied/application state emphasis.
- Use `warning-*` for draft or in-progress states.
- Use `danger-*` for destructive actions and error states.
- Use `p-page`, `p-page-mobile`, `p-panel`, `gap-section`, `gap-cluster`, and `gap-inline` for common layout rhythm.
- Keep radii at `rounded-control`, `rounded-panel`, or `rounded-pill`; do not introduce larger rounded cards.

## Layout

- The app shell uses a fixed sidebar on desktop and compact icon navigation on mobile.
- Page content uses a centered `max-w-[1200px]` stack with `gap-section`.
- Use panels for functional groups only: forms, tables, summaries, and drawer sections.
- Do not nest panels inside panels.
- Tables should stay horizontally scrollable instead of compressing action buttons.
- Drawers are for focused edits and should keep actions near the fields they save.

## Components

- Buttons use icon + text for clear commands and icon-only buttons for table actions.
- Icon-only buttons need an `aria-label`.
- Inputs, selects, and textareas share the same border, radius, focus ring, and typography.
- Status badges use semantic color groups:
  - `active`, `interviewing`, `offer`: brand
  - `draft`, `technical_test`: warning
  - `applied`: accent
  - `rejected`, `closed`: danger
- Empty, loading, success, and error states should be short inline blocks, not modal interruptions.

## Tailwind Usage

- Prefer Tailwind utilities directly in components.
- Keep global CSS limited to Tailwind imports, tokens, base element defaults, and rare browser-level behavior.
- When a class list repeats across components, extract a React component or a small local constant before adding global CSS.
- Avoid arbitrary colors when a token exists.
- Avoid viewport-scaled text. Use fixed Tailwind text sizes and responsive layout changes.
- Use responsive utilities at the component site so mobile behavior is visible where the markup lives.
