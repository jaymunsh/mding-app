export const WELCOME_MARKDOWN = `# mding sample workspace

This file shows the Markdown effects currently supported by mding.

## Basics

Use **bold**, *italic*, ~~strikethrough~~, inline \`code\`, links like [Vercel](https://vercel.com), and emoji like ✅.

---

## Lists

- Create folders and Markdown files
- Edit source text
- Preview rendered Markdown offline

1. Import Markdown
2. Edit locally
3. Export a backup

## Tasks

- [x] CommonMark and GFM
- [x] Obsidian-style callouts
- [x] Mermaid diagrams
- [ ] Local image attachment management is intentionally out of scope for now

## Table

| Feature | Status |
| --- | --- |
| Tables | Supported |
| Task lists | Supported |
| Code highlighting | Supported |
| Mermaid | Supported |

## Callouts

> [!NOTE] Note callout
> This uses Obsidian-style callout syntax.

> [!TIP]+ Open folded block
> The plus marker opens this block by default.

> [!WARNING]- Closed folded block
> The minus marker keeps this block closed until you expand it.

## Code

~~~ts
type DocumentStatus = "draft" | "saved"

const status: DocumentStatus = "saved"
console.log(status)
~~~

## Mermaid

~~~mermaid
graph TD
  A[Create note] --> B[Preview Markdown]
  B --> C{Need changes?}
  C -->|Yes| D[Edit source]
  D --> B
  C -->|No| E[Export backup]
~~~

## Image

![mding app icon](/icons/pwa-192x192.png)

## Quote

> Plain blockquotes still render as regular quotes when they do not start with a callout marker.
`

export const ABOUT_US_HTML = `<!doctype html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>mding HTML sample</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #ffffff;
      --panel: #f7f7f4;
      --fg: #181916;
      --muted: #65685f;
      --border: #d9dbd2;
      --accent: #2f6f5e;
      --code: #eeeeeb;
    }
    html[data-theme="dark"] {
      color-scheme: dark;
      --bg: #111210;
      --panel: #191a17;
      --fg: #f3f4ed;
      --muted: #a9ada1;
      --border: #31342e;
      --accent: #60b49d;
      --code: #25251f;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; scroll-padding-top: 72px; }
    body {
      margin: 0;
      color: var(--fg);
      background: var(--bg);
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.6;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      border-bottom: 1px solid var(--border);
      background: color-mix(in srgb, var(--bg) 92%, transparent);
      backdrop-filter: blur(8px);
    }
    header strong { font-size: 18px; }
    header nav {
      display: flex;
      flex: 1;
      gap: 8px;
      overflow-x: auto;
    }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    button {
      min-height: 32px;
      padding: 0 10px;
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--fg);
      background: var(--panel);
      font: inherit;
      cursor: pointer;
    }
    main {
      width: min(900px, 100%);
      margin: 0 auto;
      padding: 28px 20px 80px;
    }
    section { padding: 18px 0; border-bottom: 1px solid var(--border); }
    h1 { margin: 0 0 12px; font-size: clamp(32px, 6vw, 56px); line-height: 1.05; }
    h2 { margin: 0 0 8px; font-size: 22px; }
    p { margin: 0 0 12px; }
    ul { margin-top: 8px; padding-left: 22px; }
    code {
      padding: 2px 6px;
      border-radius: 5px;
      color: #c0343d;
      background: var(--code);
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
    }
    pre {
      overflow-x: auto;
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--panel);
    }
    .lede { color: var(--muted); font-size: 18px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }
    .card {
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--panel);
    }
    details {
      margin-top: 12px;
      padding: 12px 14px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--panel);
    }
    summary { cursor: pointer; font-weight: 650; }
  </style>
</head>
<body>
  <header>
    <strong>mding</strong>
    <nav aria-label="Table of contents">
      <a href="#overview">Overview</a>
      <a href="#features">Features</a>
      <a href="#markdown">Markdown</a>
      <a href="#html">HTML</a>
      <a href="#backup">Backups</a>
      <a href="#install">Install</a>
    </nav>
    <button id="theme-toggle" type="button">Theme</button>
  </header>
  <main>
    <section id="overview">
      <h1>mding</h1>
      <p class="lede">A lightweight local-first Markdown workspace packaged as a Progressive Web App, with read-only HTML preview support for reference files.</p>
      <p>It started as a personal iOS/macOS Markdown viewer/editor idea, then moved to a PWA so the same app can run on iPhone, iPad, Mac, Android, and desktop browsers.</p>
    </section>

    <section id="features">
      <h2>What it does</h2>
      <div class="grid">
        <article class="card"><strong>Create</strong><p>Create, rename, delete, and organize Markdown files and folders in an app-local workspace.</p></article>
        <article class="card"><strong>Preview</strong><p>Preview Markdown, trusted HTML, code blocks, callouts, and Mermaid diagrams offline after install.</p></article>
        <article class="card"><strong>Move</strong><p>Import files, export a document, or download the whole workspace as a backup zip.</p></article>
      </div>
    </section>

    <section id="markdown">
      <h2>Markdown support</h2>
      <ul>
        <li>CommonMark basics, GitHub Flavored Markdown, tables, task lists, and strikethrough.</li>
        <li>Inline <code>code</code> and syntax-highlighted fenced code blocks.</li>
        <li>Obsidian-style callouts and folded callouts.</li>
        <li>Theme-aware Mermaid diagrams.</li>
      </ul>
      <pre class="mermaid">graph TD
  A[Create note] --> B[Preview Markdown]
  B --> C{Need changes?}
  C -->|Yes| D[Edit source]
  D --> B
  C -->|No| E[Export backup]</pre>
    </section>

    <section id="html">
      <h2>HTML preview</h2>
      <p>HTML files are preview-only, but trusted inline controls such as this theme button, menus, tabs, and local scripts can run inside the preview iframe.</p>
      <details>
        <summary>Why this sample exists</summary>
        <p>This file is bundled as a default workspace item so HTML navigation, dark/light mode, Mermaid rendering, and preview zoom can be tested immediately.</p>
      </details>
    </section>

    <section id="backup">
      <h2>Storage and backups</h2>
      <p>Workspace data is stored in the installed browser app's local IndexedDB. Use <strong>Backup</strong> before clearing browser data, deleting the installed app, reinstalling the OS, or switching devices.</p>
      <ul>
        <li><code>Backup</code> downloads the whole workspace as a zip file.</li>
        <li>The zip contains <code>manifest.json</code> plus readable files under <code>workspace/</code>.</li>
        <li><code>Import backup</code> restores mding zip backups and older JSON backups.</li>
      </ul>
    </section>

    <section id="install">
      <h2>Install as a PWA</h2>
      <p>Deploy the built <code>dist/</code> output to an HTTPS static host, open it once, install it from the browser, then open the installed app once online so the app shell and renderer chunks are cached.</p>
    </section>
  </main>
  <script>
    document.getElementById("theme-toggle").addEventListener("click", function () {
      var root = document.documentElement;
      root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    });
  </script>
</body>
</html>`
