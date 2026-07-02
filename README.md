# mding

mding is a lightweight local-first Markdown workspace packaged as a PWA. It is intended for personal use on iOS, iPadOS, and macOS.

## What It Does

- Create, rename, delete, and organize Markdown files and folders in an app-local workspace.
- Preview Markdown, switch to source editing, and save locally.
- Render CommonMark and GitHub Flavored Markdown, including horizontal rules, tables, task lists, autolinks, strikethrough, images, Obsidian-style callouts, folded callouts, syntax-highlighted code fences, and Mermaid code fences.
- Import `.md` and `.markdown` files into the workspace.
- Export the current Markdown file or the whole workspace backup.
- Run offline after installation through the browser PWA cache.
- Register `.md` / `.markdown` file handling on macOS when installed through Chromium browsers.

## Local Development

```sh
corepack pnpm install
corepack pnpm dev
```

Open `http://localhost:5173/`.

## Production Preview

```sh
corepack pnpm build
corepack pnpm serve:pwa
```

Open `http://localhost:4173/`.

This local preview proves the built app shell, manifest, service worker, and static assets are generated correctly. Long-term installation should use an HTTPS static host.

## Install As A PWA

See [docs/pwa-install.md](docs/pwa-install.md).

Short version:

- Deploy `dist/` to any static HTTPS host.
- Open that HTTPS URL once on the target device.
- Install from Safari on iOS/iPadOS, or Chrome/Edge on macOS.
- After the first load and install, the app shell works offline.

## Verification

```sh
corepack pnpm verify
corepack pnpm serve:pwa
corepack pnpm audit:pwa
corepack pnpm qa:visual
```

`audit:pwa` and `qa:visual` expect the production preview server to be running at `http://127.0.0.1:4173/`.

## Storage Model

Workspace data is stored in browser-local IndexedDB. Use the workspace export button for backups, especially before clearing browser data or switching devices.

Mermaid support is loaded only when a document contains a `mermaid` fenced code block. Syntax highlighting is also loaded on demand for common code fence languages. These chunks are still included in the PWA cache so rendered documents work offline after installation.
