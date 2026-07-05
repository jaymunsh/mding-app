# Contributing to mding

mding is a small local-first Markdown and HTML PWA. Contributions are welcome when
they keep the app lightweight, offline-friendly, and easy to understand.

## Project Scope

Good fits:

- Markdown reader/editor improvements.
- PWA install, update, offline, and backup reliability.
- Small UX fixes for iOS, iPadOS, macOS, Android, and desktop browsers.
- Markdown rendering features that stay portable.
- Read-only HTML preview fixes for trusted personal files.

Non-goals for now:

- Cloud sync accounts or server-side document storage.
- A full Notion or Obsidian clone.
- Native iOS/macOS wrappers unless they stay clearly optional.
- Complex plugin systems before the core app is stable.

## Local Setup

```sh
corepack pnpm install
corepack pnpm dev
```

Open `http://localhost:5173/`.

## Verification

Before opening a pull request, run:

```sh
corepack pnpm verify
```

For PWA behavior:

```sh
corepack pnpm build
corepack pnpm serve:pwa
```

Then test the production preview at `http://localhost:4173/`.

## Pull Request Guidelines

- Keep changes small and focused.
- Include screenshots or short notes for UI changes.
- Explain any storage, backup, or offline behavior changes.
- Do not commit private notes, imported documents, real backups, or generated local test data.
- Preserve the existing React, TypeScript, Biome, and design-system conventions.

## Issue Guidelines

When reporting a bug, include:

- Platform and browser, for example iOS Safari home-screen PWA or macOS Chrome PWA.
- Whether the app was installed or running directly in the browser.
- Steps to reproduce.
- Expected behavior and actual behavior.
- Whether clearing site data, reinstalling, or importing a backup was involved.

Avoid attaching private Markdown, HTML, or backup files. Trim examples to the smallest safe reproduction.
