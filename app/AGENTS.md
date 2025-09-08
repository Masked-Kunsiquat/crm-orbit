# AGENTS.md — App (Screens & Routing)

Scope: rules for screens in `app/` using `expo-router`.

—

## Routing & Files

- Use file‑system routing. Dynamic segments use `[param].tsx`.
- Configure titles and presentation in `app/_layout.tsx` via `<Stack.Screen />`.
- Keep screens thin: delegate data access and logic to `lib/`.
- Co‑locate only view concerns here (layout, navigation, user input).

Examples

- Lists live at `index.tsx` (e.g., People list).
- Creation flows at `.../new.tsx`; edits at `.../edit.tsx`.
- Use absolute hrefs in links (e.g., `href="/people/new"`).

—

## Data Flow

- Read/write via `lib/db` only; do not touch SQLite directly in screens.
- Refresh lists when returning to a screen via `useFocusEffect`.
- Handle async with try/finally to keep loading indicators correct.

—

## Navigation

- Use `Link` from `expo-router` with `asChild` wrapping a `Pressable`.
- All actionable elements include `accessibilityRole`, `accessibilityLabel`, and `hitSlop`.
- Prefer simple, explicit routes; avoid constructing paths at runtime when not necessary.

—

## Platform & UX

- Date/time picking: use `components/DateTimeField`.
  - iOS: inline or default `mode="datetime"` is fine.
  - Android: two‑step flow (date then time) via `lib/datetime#openAndroidDateTimePicker`.
- Keep touch targets comfortable; use `MIN_HIT_SLOP_10`.
- Show user‑friendly errors; never surface raw stack traces to the UI.

—

## Style & Structure

- TypeScript only. Type screen props and state.
- 2‑space indentation; Prettier defaults; require semicolons.
- No commented‑out dead code.

—

## Phase Discipline

- Do not implement future‑phase screens in an earlier phase branch.
- Example branches: `phase/1-people`, `phase/2-interactions`, `phase/3-reminders`.

—

Last updated: 2025-09-08

