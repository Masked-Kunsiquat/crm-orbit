# AGENTS.md — Lib (DB, Auth, Notifications, Helpers)

Scope: runtime logic and platform glue in `lib/`.

—

## Modules & Responsibilities

- `db.ts`: schema init, migrations, and CRUD for people, interactions, reminders.
- `datetime.ts`: Android two‑step date→time picker orchestration.
- `notify.ts`: local notification scheduling and cancellation.
- `ui.ts`: shared UI helpers (e.g., `MIN_HIT_SLOP_10`).

—

## Database Conventions (current code)

- General
  - Enable `PRAGMA foreign_keys = ON` and `journal_mode = WAL`.
  - Table names are `snake_case`. Indices where reads benefit.
  - Wrap schema changes in `BEGIN`/`COMMIT`; `ROLLBACK` on errors.

- people
  - `id INTEGER PRIMARY KEY AUTOINCREMENT`.
  - `created_at`/`updated_at`: epoch milliseconds (INTEGER).
  - Example index: `(last_name, first_name)`.

- interactions
  - `id TEXT PRIMARY KEY` (generated via local `generateId()`).
  - `person_id TEXT` (references `people(id)`), `happened_at TEXT` (ISO 8601), `channel TEXT`, `summary TEXT`.
  - Index on `(person_id, happened_at DESC)`.

- reminders
  - `id TEXT PRIMARY KEY`, `person_id TEXT` (FK), `due_at TEXT` (ISO 8601), `done INTEGER 0/1`, `title TEXT`, `notes TEXT?`.
  - Indices: `due_at`, `(person_id, due_at)`.

- Type casting
  - Cast person ids to `String(...)` when writing `TEXT` FKs; use `Number(...)` when updating `people`.

- Migrations
  - Detect shape via `PRAGMA table_info(...)`; create a new table, transform rows in JS, swap tables.
  - Always index after migration; keep operations idempotent.

—

## Authentication & Security

- Biometric/device credential gate in `components/AuthGate` uses `expo-local-authentication`.
- Development ergonomics: allow pass‑through on Web and non‑enrolled devices.
- Secrets/preferences: `expo-secure-store` only.

—

## Notifications

- Initialize handler and permissions at startup; set Android channel `reminders`.
- Schedule via `notify.scheduleReminder(...)`; cancel via `notify.cancelReminderById(...)`.
- Notifications carry `data` with `reminderId` and `personId`.

—

## Helpers

- `openAndroidDateTimePicker(initial: Date): Promise<Date | null>`
  - Opens date picker, then time picker; returns combined `Date` or `null` if canceled.
- `MIN_HIT_SLOP_10`: constant hit slop for tap targets.

—

## Style

- TypeScript only. Avoid `any`. Keep functions small and predictable.
- No commented‑out code. Prefer short module docs where non‑obvious.

—

Last updated: 2025-09-08

