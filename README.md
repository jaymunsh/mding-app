# mding

[English](README.md) | [한국어](README.ko.md)

mding is a lightweight local-first Markdown workspace packaged as a Progressive Web App, with read-only HTML preview support for reference files. It started as a personal iOS/macOS Markdown viewer/editor idea, then moved to a PWA so the same app could run on iPhone, iPad, Mac, and Android without TestFlight, sideloading, or a native app-store release.

The goal is simple: keep a small Markdown workspace on the device, open files quickly, preview them cleanly, edit when needed, and export backups before moving devices or clearing browser data.

## Platform Support

- iOS and iPadOS: install from Safari with Add to Home Screen.
- macOS: install as a Safari web app, or install from Chrome/Edge for the most complete PWA behavior.
- Android: install from Chrome/Edge and other PWA-capable browsers.
- Desktop browsers: usable directly from the hosted URL.

After the first successful online load, the app shell and built assets are cached by the service worker. That includes the Markdown renderer, syntax highlighting chunks, and Mermaid renderer chunks, so Mermaid diagrams continue to render offline after the app has been installed and opened once. External image URLs still need network access unless the image is embedded in the Markdown or already available from browser cache.

## What It Does

- Create, rename, delete, and organize Markdown files and folders in an app-local workspace.
- Preview Markdown, switch to source editing, and save locally.
- Import `.md`, `.markdown`, `.html`, and `.htm` files into the workspace.
- Export the current document file or the whole workspace backup.
- Run offline after installation through the browser PWA cache.
- Register Markdown and HTML file handling on macOS when installed through Chromium browsers.
- Support light mode, dark mode, and compact mobile layouts.

## HTML Preview

HTML files are intentionally preview-only. mding stores the single imported `.html` / `.htm` file in the same local workspace, renders it inside a sandboxed iframe, and removes executable embedded elements before previewing. Static Mermaid blocks such as `<pre class="mermaid">`, `<div class="mermaid">`, and `<code class="language-mermaid">` are rendered by mding before the iframe loads.

Editing HTML and managing external local asset folders are out of scope for now. Remote URLs, data URLs, and inline CSS can work if the browser can resolve them.

## Markdown Support

mding aims for the practical Notion/Obsidian-style Markdown surface needed for personal notes:

- CommonMark basics: headings, paragraphs, emphasis, bold, blockquotes, horizontal rules, links, and inline code.
- GitHub Flavored Markdown: tables, task lists, autolinks, and strikethrough.
- Lists: unordered, ordered, nested, and task-style checkboxes.
- Code: inline code badges and syntax-highlighted fenced code blocks for common languages.
- Diagrams: fenced `mermaid` blocks with light/dark theme-aware rendering.
- Callouts: Obsidian-style `[!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!DANGER]`, `[!QUOTE]`, and related variants.
- Folded callouts: `> [!NOTE]+` opens by default and `> [!NOTE]-` starts collapsed.
- Images: Markdown image syntax for remote URLs, embedded data URLs, and paths that the browser can resolve. mding does not currently manage local image attachments as separate app assets.
- Emoji: rendered as normal Unicode text.

This is not trying to clone every Notion database or Obsidian plugin feature. It focuses on portable Markdown files plus a few high-value reader effects.

## Storage And Backups

Workspace data is stored in the installed browser app's local IndexedDB:

- iOS/iPadOS Safari home-screen apps use Safari-managed website storage for that installed web app.
- macOS Safari web apps use Safari-managed website storage for that web app.
- macOS Chrome/Edge PWAs use that browser profile's app storage.
- Android PWAs use the installing browser's site/app storage.

This makes editing and reading local documents work offline after installation, but it is still browser-managed storage rather than a user-visible folder. Use the workspace export button for backups, especially before clearing browser data, deleting the installed app, reinstalling the OS, or switching devices.

Current backup flow:

- `Backup` downloads the whole workspace as a zip file.
- The zip contains `manifest.json` for exact app restore plus readable `.md` and `.html` files under `workspace/`.
- `Import backup` restores mding zip backups and older JSON backups into the app-local workspace.
- Individual Markdown and HTML files can still be imported/exported separately.

Future backup options worth considering:

- Reminder-based manual backup prompts after meaningful edits.
- Optional local image attachment management with an `assets/` folder.
- Optional file-system folder sync on browsers that support the File System Access API.

## Install As A PWA

See [docs/pwa-install.md](docs/pwa-install.md).

Short version:

1. Deploy the built `dist/` output to a static HTTPS host such as Vercel, Netlify, Cloudflare Pages, or GitHub Pages.
2. Open that HTTPS URL once on the target device.
3. Install from Safari on iOS/iPadOS, Safari or Chrome/Edge on macOS, or Chrome/Edge on Android.
4. Open the installed app once while online so the app shell and renderer chunks are cached.
5. Use it offline from the installed app icon.

References:

- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [web.dev: Service workers](https://web.dev/learn/pwa/service-workers)
- [Apple Support: Turn a website into an app in Safari on iPhone](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios)
- [Apple Support: Use Safari web apps on Mac](https://support.apple.com/en-us/104996)

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

## Verification

```sh
corepack pnpm verify
corepack pnpm serve:pwa
corepack pnpm audit:pwa
corepack pnpm qa:visual
```

`audit:pwa` and `qa:visual` expect the production preview server to be running at `http://127.0.0.1:4173/`.

## Screenshots

![mding mobile workspace](docs/imgs/img1.png)

![mding mobile markdown preview](docs/imgs/img2.png)
