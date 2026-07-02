# mding PWA Install Guide

## Mental Model

The server is not the app runtime. It is only the delivery and update address for the static PWA files.

After installation:

- App shell: cached by the service worker.
- Workspace data: stored in local IndexedDB.
- Offline use: available after the first successful load.
- Updates: delivered when the hosted files change and the browser refreshes the service worker cache.

## Build

```sh
corepack pnpm install
corepack pnpm build
```

The installable app is emitted to `dist/`.

## Host

Upload the contents of `dist/` to a static HTTPS host.

Good fits:

- Cloudflare Pages
- GitHub Pages
- Netlify
- Vercel static deployment

The host must serve over HTTPS for production PWA install and service worker behavior.

## Install On iOS And iPadOS

1. Open the hosted HTTPS URL in Safari.
2. Tap Share.
3. Tap Add to Home Screen.
4. Launch mding from the Home Screen.
5. Open it once while online so the app shell and icons are cached.

iOS stores the workspace locally for that installed web app. Export a workspace backup when moving devices or before clearing website data.

## Install On macOS

For the best app-like behavior, use Chrome or Edge.

1. Open the hosted HTTPS URL in Chrome or Edge.
2. Use the browser install action from the address bar or app menu.
3. Launch mding from Applications, Launchpad, Dock, or Spotlight.
4. Open it once while online so the app shell is cached.

macOS Markdown file handling is declared in the web app manifest for Chromium-installed PWAs:

- `.md`
- `.markdown`

That path lets the installed PWA receive files opened from Finder. Safari-installed web apps do not currently provide the same Markdown file-handler behavior.

## Offline Check

1. Install the app.
2. Open mding while online.
3. Create or import a Markdown file.
4. Quit the browser/app.
5. Disconnect from the network.
6. Reopen mding from the installed app icon.

The app shell should open and previously stored workspace data should still be available.

## Backup Habit

PWA local storage is durable enough for personal use, but it is still browser-managed storage. Use Export to create a workspace backup file before browser resets, OS reinstalls, or device changes.
