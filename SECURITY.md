# Security Policy

mding is a local-first PWA. Documents are intended to stay in browser-managed
local storage unless the user exports or imports files manually.

## Supported Versions

Security fixes target the latest version on `main`.

## Reporting a Vulnerability

If GitHub private vulnerability reporting is enabled for the repository, use it.
Otherwise, open a minimal public issue without private documents, credentials, or
personal data.

Useful reports include:

- A short description of the risk.
- The affected platform and browser.
- Minimal reproduction steps.
- Whether the issue involves imported Markdown, imported HTML, backups, service
  worker caching, or local storage.

Do not attach private notes, real backups, or sensitive HTML files. Replace them
with a reduced sample.

## HTML Preview Trust Model

Imported HTML is treated as trusted personal content and is allowed to run inside
the preview iframe so local controls and scripts can work. Only import HTML files
you trust.

This is a deliberate product tradeoff. Reports about unexpected data exposure,
storage access, service worker behavior, or script execution boundaries are still
welcome.
