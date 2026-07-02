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

Workspace data is stored in the installed browser app's local IndexedDB:

- iOS/iPadOS Safari home-screen apps use Safari-managed website storage for that installed web app.
- macOS Safari web apps use Safari-managed website storage for that web app.
- macOS Chrome/Edge PWAs use that browser profile's app storage.

This makes editing and reading local documents work offline after installation, but it is still browser-managed storage rather than a user-visible folder. Use the workspace export button for backups, especially before clearing browser data, deleting the installed app, reinstalling the OS, or switching devices.

Current backup flow:

- `Export` downloads the whole workspace as a JSON backup.
- `Import backup` restores that JSON backup into the app-local workspace.
- Individual Markdown files can still be imported/exported separately.

Future backup options worth considering:

- Reminder-based manual backup prompts after meaningful edits.
- Zip backup with Markdown files plus an `assets/` folder.
- Optional file-system folder sync on browsers that support the File System Access API.

Mermaid support is loaded only when a document contains a `mermaid` fenced code block. Syntax highlighting is also loaded on demand for common code fence languages. These chunks are still included in the PWA cache so rendered documents work offline after installation.
