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
- [ ] Local image attachment management

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
