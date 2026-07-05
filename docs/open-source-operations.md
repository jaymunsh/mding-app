# Open Source Operations

This document describes how mding can be run as a small open-source project.

## Positioning

mding is not a cloud notes platform. It is a local-first, installable PWA for a
small Markdown workspace with read-only HTML preview support.

The useful open-source angle is:

- PWA instead of TestFlight or sideloading.
- Local-first document storage with explicit backup/export.
- Practical Markdown rendering with Mermaid and callouts.
- Cross-platform install path for iOS, iPadOS, macOS, Android, and desktop.
- A compact reference implementation for personal note tools.

## Distribution Model

There are two distribution surfaces:

1. GitHub repository: source code, issues, releases, documentation, license.
2. Static HTTPS deployment: the installable PWA that users open and add to their
   home screen or dock.

The hosted PWA does not need an application server. It can be deployed to Vercel,
Netlify, Cloudflare Pages, GitHub Pages, or any static HTTPS host.

## Recommended GitHub Settings

In GitHub repository settings:

- Set the repository visibility to `Public` when ready.
- Add description: `Local-first Markdown workspace packaged as an installable PWA.`
- Add website URL: the production PWA URL after deployment.
- Add topics: `markdown`, `pwa`, `local-first`, `notes`, `mermaid`, `offline-first`,
  `react`, `typescript`.
- Enable Issues.
- Disable Wiki unless there is a clear documentation plan.
- Disable Projects unless active roadmap tracking is needed.
- Enable private vulnerability reporting if available.

## Versioning

Use simple semantic versions:

- Patch: bug fixes and small UI corrections.
- Minor: new user-facing features.
- Major: storage format or backup compatibility changes that need migration notes.

Suggested release flow:

1. Update `package.json` and `APP_VERSION`.
2. Run `corepack pnpm verify`.
3. Merge or push to `main`.
4. Wait for the static host deployment.
5. Create a Git tag such as `v1.4.0`.
6. Create a GitHub Release with short notes and any backup/update caveats.

## Issue Triage

Label issues by impact:

- `bug`: broken behavior.
- `enhancement`: feature request.
- `docs`: documentation update.
- `pwa`: install, service worker, update, offline, or cache behavior.
- `storage`: IndexedDB, backup, import, export, or migration behavior.
- `markdown`: Markdown rendering.
- `html-preview`: read-only HTML preview.

Priority order:

1. Data safety and backup/import/export reliability.
2. Install/update/offline behavior.
3. Reader/editor usability.
4. Markdown/HTML rendering support.
5. Nice-to-have polish.

## Contribution Policy

Keep the default contribution path lightweight:

- Issues are enough at the beginning.
- Pull requests should stay small and include verification notes.
- Avoid accepting large architecture changes until the storage and backup model is
  stable.
- Reject features that require a server account unless they are clearly optional.

## Maintenance Routine

Weekly or whenever actively using the app:

- Check new issues.
- Reproduce high-impact bugs.
- Keep dependencies patched.
- Run `corepack pnpm verify` before each release.
- Re-test install/update behavior on at least one mobile and one desktop browser.

Before making a risky storage change:

- Export a backup from an older version.
- Import it into the new version.
- Verify Markdown, HTML, folders, and reading progress still behave as expected.
