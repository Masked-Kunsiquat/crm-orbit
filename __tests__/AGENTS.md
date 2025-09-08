# AGENTS.md — Tests

Scope: Jest tests under `__tests__/`.

—

## Philosophy

- Keep tests deterministic and focused on observable behavior.
- Prefer higher‑level tests around `lib/` (DB, notifications) and screens.
- Minimize coupling to internal implementation details.

—

## Patterns

- Use `beforeEach` to initialize DB state (e.g., call `initDb()`).
- Freeze time for timestamp assertions (mock `Date.now`).
- Mock platform APIs (e.g., notifications, local auth) where needed.
- Place tests here, not co‑located next to source files.

—

## Examples in Repo

- `db` smoke tests ensure `updated_at` changes when interactions are added.
- Component tests cover accessible labels and basic interactions.

—

## Tips

- Avoid relying on remote network; tests should run offline.
- If a new module needs setup/mocks, add or update the Jest setup file rather than per‑test duplication.

—

Last updated: 2025-09-08

