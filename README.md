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
- Support English/Korean UI, light mode, dark mode, and compact mobile layouts.
- Use a soft ivory light theme and a compact settings popover for theme/language selection.

## Open Source Status

mding is designed to be open source as a small, personal, local-first PWA rather than a hosted notes service. The code is useful as both an app and a reference implementation for people who want a lightweight Markdown workspace without TestFlight, sideloading, accounts, or a native app-store release.

Project boundaries:

- Local-first by default. No server-side document storage.
- PWA distribution first. Native wrappers are optional future work, not the core product.
- Portable Markdown files and explicit backups matter more than cloud features.
- Trusted read-only HTML preview is supported for personal reference files.

For contribution and maintenance details, see:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [SECURITY.md](SECURITY.md)
- [Open Source Operations](docs/open-source-operations.md)
- [오픈소스 운영 가이드](docs/open-source-operations.ko.md)

## Default Workspace

New local workspaces start with two sample files:

- `markdown-example.md`: a Markdown feature sample with tables, task lists, inline code, callouts, code highlighting, Mermaid, images, and blockquotes.
- `about-mding.html`: a read-only HTML sample that exercises in-frame navigation, local scripts, theme toggling, Mermaid rendering, and preview zoom.

Existing browser workspaces are not renamed automatically. The seed files only apply when mding opens with an empty local workspace.

## HTML Preview

HTML files are preview-only, but they run as normal trusted HTML inside the preview iframe so local controls such as hamburger menus, tabs, and inline scripts can work. Static Mermaid blocks such as `<pre class="mermaid">`, `<div class="mermaid">`, and `<code class="language-mermaid">` are rendered by mding before the iframe loads.

Editing HTML and managing external local asset folders are out of scope for now. Only import HTML you trust, because scripts in the file are allowed to run.

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

## Install And Updates

Deploy the built `dist/` output to a static HTTPS host such as Vercel, Netlify, Cloudflare Pages, or GitHub Pages. Share that HTTPS URL as the install link.

Installation:

1. Open the hosted URL on the target device.
2. iOS/iPadOS: use Safari share sheet, then Add to Home Screen.
3. macOS Safari: use Add to Dock. macOS Chrome/Edge: use the browser app install action.
4. Android: install from Chrome/Edge or another PWA-capable browser.
5. Open the installed app once while online so the app shell and renderer chunks are cached.

Updates:

- A push to the hosting branch is not the same as an immediate installed-app update.
- The host must finish deployment first, then the installed PWA checks the service worker and cached assets.
- Desktop browsers usually update after a hard reload or app restart.
- iOS home-screen PWAs can lag behind; fully quit the app, reopen it, or reboot the device if it keeps showing an older bundle.
- If reinstalling the app, export a workspace backup first because data is browser-managed local storage.

References:

- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [web.dev: Service worker updates](https://web.dev/learn/pwa/update)
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

## License

mding is released under the [MIT License](LICENSE).

## Screenshots

<p align="center">
  <img src="docs/imgs/img1.png" alt="mding mobile workspace list" width="280" />
  <img src="docs/imgs/img2.png" alt="mding mobile Markdown detail" width="280" />
</p>
