# AGENTS.md — Conventions & Standards for CRM‑Orbit (Expo/Android‑first)

This file defines conventions, coding standards, and workflow rules.
**Goal**: Keep all human + AI agents consistent when contributing.

---

## 1. Project Scope

* **Name**: `crm-orbit`
* **Purpose**: Monica CRM alternative, mobile-first, offline-first.
* **Target**: Android (Expo managed workflow).
* **Core modules**:

  * People
  * Interactions
  * Reminders
  * Tags
* **MVP focus**: Privacy, speed, offline reliability.

---

## 2. Language & Framework

* **Language**: TypeScript (no plain JS files).
* **Framework**: Expo (managed).
* **Router**: `expo-router`.
* **Database**: `expo-sqlite`.
* **Device APIs**: `expo-local-authentication`, `expo-secure-store`, `expo-notifications`.

---

## 3. Code Style

* **Imports**: Always use ES modules.
* **Type safety**: All functions & props typed. Use interfaces/types.
* **Naming**:

  * Components: `PascalCase` (`PersonCard.tsx`).
  * Hooks & utils: `camelCase` (`usePeople.ts`).
  * Constants: `SCREAMING_SNAKE_CASE`.
* **Formatting**:

  * 2-space indentation.
  * Prettier default config.
  * Semi-colons **required**.
* **Comments**:

  * Short docstring-style above complex functions.
  * No commented-out dead code; delete it.

---

## 4. Directory Structure

```
/app              → expo-router screens
/components       → reusable UI
/lib              → db, auth, storage, helpers
/types            → TypeScript types
/assets           → images, icons, static files
```

---

## 5. Database Conventions

* IDs: `uuid()` helper from `crypto.getRandomValues`.
* `created_at` and `updated_at`: ISO8601 strings, always set.
* Foreign keys: `ON DELETE CASCADE` to avoid orphans.
* Table names: `snake_case`.
* Don’t modify schema inline → create migration helpers in `/lib/db`.

---

## 6. Authentication & Security

* App is **locked** behind biometric/device credential.
* **Secrets**: stored in `expo-secure-store` only.
* **DB**: plaintext SQLite (sandboxed); encryption requires eject (future).

---

## 7. UX Standards

* **Buttons**: `Button` or `Pressable` with accessible labels.
* **Touchable areas**: use `hitSlop={10}` minimum.
* **Accessibility**: decorative icons → `accessible={false}`.
* **Error messages**: always user-friendly, no raw stack traces.

---

## 8. Git Conventions

* **Branches**:

  * `phase/1-people`
  * `phase/2-interactions`
  * `phase/3-reminders`
  * `phase/4-tags`
* **Commits**: Conventional Commits style:

  * `feat(people): add new person form`
  * `fix(db): update schema migration for reminders`
  * `chore: configure expo-router plugin`
* One logical change per commit.

---

## 9. AI Agent Rules

* **Before coding**: Ask for file path + existing content if ambiguous.
* **Output**: Always in a complete file block, not diff-only (unless user says patch).
* **Do not**: invent APIs; verify against Expo docs.
* **When stuck**: prefer asking clarification vs. guessing.
* **Phase discipline**: Do not bleed Phase 2 features into Phase 1 branch.

---

## 10. Future Enhancements

* Optional sync (PocketBase/Supabase).
* Import from phone contacts.
* File attachments (Expo FileSystem).
* Record-level encryption if ejected.

---

## 11. Commit Examples

```bash
git checkout -b phase/1-people
git add .
git commit -m "feat(people): implement people list and add form"

git checkout -b phase/2-interactions
git add .
git commit -m "feat(interactions): log new interactions with timestamp"
```

---

*Last updated: 2025-09-05*

---

## 12. Shell & Command Conventions (Windows/PowerShell)

The primary environment is Windows with PowerShell. Prefer the following patterns to avoid cross-shell issues.

- Default shell: PowerShell (not Bash). Avoid using `&&`/`||`; chain commands with `;` or new lines.
- Working repo: Git root lives in `crm-orbit`. `Set-Location crm-orbit` before running Git.
- Paths: Use workspace-relative paths (e.g., `crm-orbit/components/DateTimeField.tsx`).

Reading files

```powershell
# Entire file (as single string)
Get-Content -Path crm-orbit/components/DateTimeField.tsx -Raw

# First N lines / chunked reads
Get-Content -Path crm-orbit/components/DateTimeField.tsx -TotalCount 200

# Range of lines: skip then take
Get-Content -Path crm-orbit/components/DateTimeField.tsx | Select-Object -Skip 200 -First 100

# With line numbers (simple)
$i=0; Get-Content crm-orbit/components/DateTimeField.tsx | ForEach-Object { $i++; "${i}: $_" }
```

Searching text and files

```powershell
# Grep equivalent (recursive)
Select-String -Path crm-orbit -Pattern "DateTimePicker" -Recurse

# Only file paths (unique)
Select-String -Path crm-orbit -Pattern "DateTimePicker" -Recurse | Select-Object -ExpandProperty Path -Unique

# List files/directories
Get-ChildItem -Path crm-orbit/components -File
Get-ChildItem -Path crm-orbit -Recurse -Directory
```

Git usage (PowerShell-safe)

```powershell
# Ensure you are in the repo root
Set-Location crm-orbit

# Create/switch branches
git checkout -b phase/1-people
git switch phase/3-reminders

# Stage & commit (quote messages)
git add -A
git commit -m 'fix(components): Android two-step DateTimePicker to prevent crash'

# Inspect state
git status
git branch --show-current
git log -1 --oneline

# Line endings on Windows (optional)
git config core.autocrlf true
```

Command chaining in PowerShell

```powershell
# Use semicolons or new lines, not && / ||
Get-ChildItem crm-orbit/components -File; git status

# Conditional flow example
Select-String -Path crm-orbit -Pattern "DateTimeField" -Recurse; if ($LASTEXITCODE -eq 0) { git status }
```

Notes

- Large outputs may be truncated; prefer chunked reads with `-TotalCount`/`-Skip`.
- `rg`/`grep` may not exist; use `Select-String` instead.
- When searching node_modules, filter paths to avoid noise.
