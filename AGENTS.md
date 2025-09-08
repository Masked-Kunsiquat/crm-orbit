# AGENTS.md — CRM‑Orbit Contributor Guide (Hub)

This is the top‑level guide. It links to focused, per‑directory guides to keep things modular and easy to maintain.

—

## Quick Principles

- TypeScript only; no `.js` files.
- Expo managed workflow; Android‑first, works on iOS and Web for dev.
- Router: `expo-router`. Database: `expo-sqlite`. Device APIs: Local Auth, Secure Store, Notifications.
- Accessibility: buttons/pressables have labels; minimum touch target padding; user‑friendly errors.
- AI agents: don’t invent APIs; prefer clarification over guessing.

—

## Directory Guides

- app: screens, routing, and navigation rules → see `app/AGENTS.md`.
- components: UI components, accessibility, platform nuances → see `components/AGENTS.md`.
- lib: database, auth, notifications, helpers → see `lib/AGENTS.md`.
- assets: images, icons, and static files → see `assets/AGENTS.md`.
- tests: testing patterns and mocks → see `__tests__/AGENTS.md`.

—

## Git & Branching

- Use Conventional Commits (e.g., `feat(people): add new person form`).
- Phase branches:
  - `phase/1-people`
  - `phase/2-interactions`
  - `phase/3-reminders`
  - `phase/4-tags`
- One logical change per commit.

—

## Shell (Windows/PowerShell)

- Default shell is PowerShell. Avoid `&&`/`||`; use `;` or new lines.
- Repo root is `crm-orbit`. Run `Set-Location crm-orbit` before Git.
- Use workspace‑relative paths (e.g., `crm-orbit/components/DateTimeField.tsx`).

Examples

```powershell
# Read a file (chunked)
Get-Content -Path crm-orbit/components/DateTimeField.tsx -TotalCount 200

# Search recursively
Select-String -Path crm-orbit -Pattern "DateTimePicker" -Recurse

# Safe Git usage
Set-Location crm-orbit; git status; git branch --show-current
```

—

Last updated: 2025-09-08
