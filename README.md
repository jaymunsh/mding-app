# mding

mding is a lightweight local-first Markdown workspace packaged as a Progressive Web App. It started as a personal iOS/macOS Markdown viewer/editor idea, then moved to a PWA so the same app could run on iPhone, iPad, Mac, and Android without TestFlight, sideloading, or a native app-store release.

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
- Import `.md` and `.markdown` files into the workspace.
- Export the current Markdown file or the whole workspace backup.
- Run offline after installation through the browser PWA cache.
- Register `.md` / `.markdown` file handling on macOS when installed through Chromium browsers.
- Support light mode, dark mode, and compact mobile layouts.

## Markdown Support

mding aims for the practical Notion/Obsidian-style Markdown surface needed for personal notes:

- CommonMark basics: headings, paragraphs, emphasis, bold, blockquotes, horizontal rules, links, and inline code.
- GitHub Flavored Markdown: tables, task lists, autolinks, and strikethrough.
- Lists: unordered, ordered, nested, and task-style checkboxes.
- Code: inline code badges and syntax-highlighted fenced code blocks for common languages.
- Diagrams: fenced `mermaid` blocks with light/dark theme-aware rendering.
- Callouts: Obsidian-style `[!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!DANGER]`, `[!QUOTE]`, and related variants.
- Folded callouts: `> [!NOTE]+` opens by default and `> [!NOTE]-` starts collapsed.
- Images: Markdown image syntax for remote URLs, embedded data URLs, and paths that the browser can resolve.
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

- `Export` downloads the whole workspace as a JSON backup.
- `Import backup` restores that JSON backup into the app-local workspace.
- Individual Markdown files can still be imported/exported separately.

Future backup options worth considering:

- Reminder-based manual backup prompts after meaningful edits.
- Zip backup with Markdown files plus an `assets/` folder.
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

---

## 한국어

mding은 개인용으로 가볍게 쓰기 위한 로컬 우선 Markdown 작업공간입니다. 처음에는 iOS/macOS용 네이티브 Markdown 뷰어 겸 편집기로 생각했지만, 무료 사이드로드의 7일 제한과 TestFlight 배포 부담을 피하고 iPhone, iPad, Mac, Android에서 같은 앱을 쓰기 위해 PWA 형태로 전환했습니다.

핵심 목표는 단순합니다. 기기 안에 작은 Markdown 작업공간을 두고, 파일을 빠르게 열고, 보기 좋은 형태로 미리보고, 필요할 때 바로 수정하고, 다른 기기로 옮기기 전에 백업 파일로 내보내는 것입니다.

## 지원 플랫폼

- iOS / iPadOS: Safari에서 홈 화면에 추가해서 사용합니다.
- macOS: Safari의 Dock에 추가 기능으로 설치하거나, Chrome/Edge에서 PWA로 설치합니다.
- Android: Chrome/Edge 등 PWA 설치를 지원하는 브라우저에서 설치합니다.
- 데스크톱 브라우저: 배포된 URL을 그대로 열어서 사용할 수 있습니다.

처음 한 번 온라인 상태에서 앱을 열면 서비스 워커가 앱 본체와 정적 자산을 캐시합니다. Markdown 렌더러, 코드 하이라이트, Mermaid 렌더러도 빌드 자산에 포함되므로 설치 후 한 번 로드된 앱에서는 오프라인에서도 Mermaid 다이어그램이 렌더링됩니다. 단, 외부 이미지 URL은 네트워크가 필요할 수 있고, Markdown 안에 포함된 data URL이나 브라우저 캐시에 있는 이미지만 오프라인에서 안정적으로 보입니다.

## 주요 기능

- 앱 내부 작업공간에서 폴더와 Markdown 파일 생성, 이름 변경, 삭제, 정리.
- Markdown 미리보기와 원문 편집 전환.
- `.md`, `.markdown` 파일 가져오기.
- 현재 Markdown 파일 또는 전체 작업공간 백업 내보내기.
- 설치 후 오프라인 실행.
- Chromium 계열 브라우저로 macOS에 설치한 경우 `.md` / `.markdown` 파일 핸들링 선언.
- 라이트 모드, 다크 모드, 모바일 레이아웃 지원.

## 지원하는 Markdown 요소

개인 노트에 필요한 Notion/Obsidian 느낌의 Markdown 효과를 우선 지원합니다.

- 기본 Markdown: 제목, 문단, 기울임, 굵게, 인용문, 가로줄, 링크, 인라인 코드.
- GitHub Flavored Markdown: 표, 체크박스, 자동 링크, 취소선.
- 목록: 순서 없는 목록, 순서 있는 목록, 중첩 목록, 태스크 체크박스.
- 코드: 인라인 코드 배지와 주요 언어 코드블록 하이라이트.
- 다이어그램: `mermaid` 코드블록.
- 콜아웃: Obsidian 스타일 `[!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!DANGER]`, `[!QUOTE]` 계열.
- 접는 콜아웃: `> [!NOTE]+`는 열린 상태, `> [!NOTE]-`는 닫힌 상태로 시작.
- 이미지: 브라우저가 접근 가능한 Markdown 이미지 URL, data URL, 경로.
- 이모지: 일반 유니코드 텍스트로 표시.

Notion 데이터베이스나 Obsidian의 모든 플러그인을 복제하는 방향은 아닙니다. 이동 가능한 Markdown 파일과 자주 쓰는 보기 효과에 집중합니다.

## 저장소와 백업

문서는 설치된 브라우저 앱의 로컬 IndexedDB에 저장됩니다.

- iOS/iPadOS 홈 화면 앱은 Safari가 관리하는 웹 앱 저장소를 사용합니다.
- macOS Safari 웹 앱은 Safari가 관리하는 웹 앱 저장소를 사용합니다.
- macOS Chrome/Edge PWA는 해당 브라우저 프로필의 앱 저장소를 사용합니다.
- Android PWA는 설치한 브라우저의 사이트/앱 저장소를 사용합니다.

오프라인 편집과 읽기에는 충분하지만, 사용자가 Finder처럼 직접 보는 폴더는 아닙니다. 브라우저 데이터 삭제, 앱 삭제, OS 재설치, 기기 변경 전에는 전체 작업공간 백업을 내보내는 습관이 필요합니다.

현재 백업 방식:

- `Export`로 전체 작업공간을 JSON 백업 파일로 다운로드합니다.
- `Import backup`으로 JSON 백업을 다시 복원합니다.
- 개별 Markdown 파일도 따로 가져오거나 내보낼 수 있습니다.

## 설치 요약

자세한 내용은 [docs/pwa-install.md](docs/pwa-install.md)를 참고하세요.

1. `dist/` 빌드 결과물을 Vercel, Netlify, Cloudflare Pages, GitHub Pages 같은 HTTPS 정적 호스트에 배포합니다.
2. 대상 기기에서 배포 URL을 한 번 엽니다.
3. iOS/iPadOS는 Safari에서 홈 화면에 추가합니다.
4. macOS는 Safari Dock 앱 또는 Chrome/Edge PWA로 설치합니다.
5. Android는 Chrome/Edge 등에서 설치합니다.
6. 설치 후 온라인 상태에서 한 번 실행해 캐시를 채운 뒤 오프라인으로 사용합니다.

## Screenshots

![mding mobile workspace](docs/imgs/img1.png)

![mding mobile markdown preview](docs/imgs/img2.png)
