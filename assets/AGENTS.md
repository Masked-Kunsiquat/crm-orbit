# AGENTS.md — Assets (Images, Icons, Static)

Scope: files under `assets/`.

—

## Organization

- Suggested subfolders (create as needed):
  - `assets/images/` for photos and screenshots.
  - `assets/icons/` for custom bitmap icons.
  - `assets/fonts/` if custom fonts are added.

—

## Naming & Size

- Use kebab‑case filenames (e.g., `person-placeholder.png`).
- Keep assets small (ideally <1–2 MB). Optimize large images before commit.
- Prefer vectors from built‑in icon packs when possible over custom bitmaps.

—

## Usage

- Import or require assets from code (Expo bundler picks them up):
  - `import img from '../assets/images/example.png';`
  - `<Image source={img} />`
- Avoid dynamic string paths when possible for bundling friendliness.

—

## Platform Notes

- Provide adequate resolution; Expo handles most density scaling.
- Avoid remote network downloads for core UI assets to keep offline‑first.

—

Last updated: 2025-09-08

