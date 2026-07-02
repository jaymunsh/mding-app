# mding

[English](README.md) | [한국어](README.ko.md)

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
- 이미지: 브라우저가 접근 가능한 Markdown 이미지 URL, data URL, 경로. 별도 로컬 이미지 첨부를 앱 자산으로 관리하지는 않습니다.
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

- `Backup`으로 전체 작업공간을 zip 파일로 다운로드합니다.
- zip 안에는 정확한 앱 복원을 위한 `manifest.json`과 사람이 바로 열어볼 수 있는 `workspace/` 아래 `.md` 파일들이 들어갑니다.
- `Import backup`으로 mding zip 백업과 기존 JSON 백업을 복원합니다.
- 개별 Markdown 파일도 따로 가져오거나 내보낼 수 있습니다.

추후 고려할 만한 백업 방식:

- 의미 있는 수정 후 수동 백업을 알려주는 리마인더.
- `assets/` 폴더를 포함한 선택적 로컬 이미지 첨부 관리.
- File System Access API를 지원하는 브라우저에서 선택적 폴더 동기화.

## PWA 설치

자세한 내용은 [docs/pwa-install.md](docs/pwa-install.md)를 참고하세요.

요약:

1. `dist/` 빌드 결과물을 Vercel, Netlify, Cloudflare Pages, GitHub Pages 같은 HTTPS 정적 호스트에 배포합니다.
2. 대상 기기에서 배포 URL을 한 번 엽니다.
3. iOS/iPadOS는 Safari에서 홈 화면에 추가합니다.
4. macOS는 Safari Dock 앱 또는 Chrome/Edge PWA로 설치합니다.
5. Android는 Chrome/Edge 등에서 설치합니다.
6. 설치 후 온라인 상태에서 한 번 실행해 캐시를 채운 뒤 오프라인으로 사용합니다.

참고:

- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [web.dev: Service workers](https://web.dev/learn/pwa/service-workers)
- [Apple Support: iPhone에서 웹 사이트를 앱처럼 열기](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios)
- [Apple Support: Mac에서 Safari 웹 앱 사용하기](https://support.apple.com/ko-kr/104996)

## 로컬 개발

```sh
corepack pnpm install
corepack pnpm dev
```

`http://localhost:5173/`을 엽니다.

## 프로덕션 미리보기

```sh
corepack pnpm build
corepack pnpm serve:pwa
```

`http://localhost:4173/`을 엽니다.

이 로컬 미리보기는 빌드된 앱 본체, 매니페스트, 서비스 워커, 정적 자산이 제대로 생성됐는지 확인하기 위한 용도입니다. 실제 장기 설치는 HTTPS 정적 호스트를 사용하는 편이 좋습니다.

## 검증

```sh
corepack pnpm verify
corepack pnpm serve:pwa
corepack pnpm audit:pwa
corepack pnpm qa:visual
```

`audit:pwa`와 `qa:visual`은 프로덕션 미리보기 서버가 `http://127.0.0.1:4173/`에서 실행 중이라고 가정합니다.

## 스크린샷

![mding 모바일 작업공간](docs/imgs/img1.png)

![mding 모바일 Markdown 미리보기](docs/imgs/img2.png)
