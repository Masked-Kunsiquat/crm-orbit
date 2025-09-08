# AGENTS.md — Components (UI)

Scope: reusable UI in `components/`.

—

## Patterns

- Component names use PascalCase; default export a single component per file.
- Props and state fully typed. Avoid `any`.
- Keep components presentational; pass callbacks and data from screens.
- Accessibility is non‑negotiable: labels, roles, and comfortable hit areas.

—

## Platform Notes

- Android date/time: use two‑step flow to avoid crashes and OEM quirks.
  - Prefer `lib/datetime#openAndroidDateTimePicker` (as in `DateTimeField`).
- iOS may use inline date‑time pickers.

—

## Styling

- Use `StyleSheet.create` with inline styles near the component.
- 2‑space indentation; Prettier defaults; semicolons required.
- No commented‑out code. Keep styles minimal and consistent.

—

## Interactions

- `Pressable` with `hitSlop={MIN_HIT_SLOP_10}` from `lib/ui`.
- Include `accessibilityRole="button"` and a clear `accessibilityLabel`.

—

## Testing

- Coarse‑grained tests live under `__tests__/` (see that guide).
- Keep component logic small and deterministic to ease testing.

—

Last updated: 2025-09-08

