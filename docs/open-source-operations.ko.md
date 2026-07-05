# 오픈소스 운영 가이드

이 문서는 mding을 작은 오픈소스 프로젝트로 공개하고 운영하는 방식을 정리합니다.

## 포지션

mding은 클라우드 노트 서비스가 아닙니다. 작은 Markdown 작업공간을 기기 안에 두고,
설치 가능한 PWA로 실행하며, 참고용 HTML 파일을 읽기 전용으로 미리보는 도구입니다.

오픈소스로서의 가치는 다음에 있습니다.

- TestFlight나 사이드로드 대신 PWA로 배포하는 구조.
- 로컬 우선 문서 저장과 명시적인 백업/내보내기.
- Mermaid, 콜아웃, 코드 하이라이트가 포함된 실용적인 Markdown 렌더링.
- iOS, iPadOS, macOS, Android, 데스크톱 브라우저를 같은 코드로 지원.
- 개인용 노트 도구를 만들 때 참고할 수 있는 작고 구체적인 구현.

## 배포 모델

배포 면은 두 가지입니다.

1. GitHub 저장소: 소스 코드, 이슈, 릴리스, 문서, 라이선스.
2. 정적 HTTPS 배포: 사용자가 열고 홈 화면이나 Dock에 추가하는 실제 PWA.

별도 애플리케이션 서버는 필요하지 않습니다. Vercel, Netlify, Cloudflare Pages,
GitHub Pages 같은 정적 HTTPS 호스트에 배포하면 됩니다.

## 추천 GitHub 설정

GitHub 저장소 설정에서 다음을 권장합니다.

- 준비가 끝나면 저장소를 `Public`으로 전환.
- 설명: `Local-first Markdown workspace packaged as an installable PWA.`
- Website URL: 실제 배포된 PWA URL.
- Topics: `markdown`, `pwa`, `local-first`, `notes`, `mermaid`, `offline-first`,
  `react`, `typescript`.
- Issues 활성화.
- Wiki는 별도 문서 계획이 생기기 전까지 비활성화.
- Projects는 로드맵을 적극 관리할 때만 활성화.
- 가능하면 private vulnerability reporting 활성화.

## 버전 관리

간단한 semantic versioning을 사용합니다.

- Patch: 버그 수정, 작은 UI 조정.
- Minor: 사용자에게 보이는 새 기능.
- Major: 저장 형식이나 백업 호환성에 영향을 주는 변경.

추천 릴리스 흐름:

1. `package.json`과 `APP_VERSION`을 올립니다.
2. `corepack pnpm verify`를 실행합니다.
3. `main`에 push 또는 merge합니다.
4. 정적 호스팅 배포가 끝날 때까지 기다립니다.
5. `v1.4.0` 같은 Git tag를 만듭니다.
6. GitHub Release에 변경점과 백업/업데이트 주의사항을 적습니다.

## 이슈 관리

이슈 라벨은 다음 기준으로 시작하면 충분합니다.

- `bug`: 깨진 동작.
- `enhancement`: 기능 제안.
- `docs`: 문서 수정.
- `pwa`: 설치, 서비스 워커, 업데이트, 오프라인, 캐시.
- `storage`: IndexedDB, 백업, 가져오기, 내보내기, 마이그레이션.
- `markdown`: Markdown 렌더링.
- `html-preview`: 읽기 전용 HTML 미리보기.

우선순위:

1. 데이터 안전성, 백업, 가져오기, 내보내기.
2. 설치, 업데이트, 오프라인 동작.
3. 읽기/편집 사용성.
4. Markdown/HTML 렌더링 지원.
5. 있으면 좋은 사용성 개선.

## 기여 정책

처음에는 가볍게 운영하는 편이 좋습니다.

- 이슈만 열어둬도 충분합니다.
- Pull request는 작게 유지하고 검증 내용을 적습니다.
- 저장소와 백업 모델이 안정되기 전에는 큰 구조 변경을 신중히 봅니다.
- 서버 계정이 필요한 기능은 명확히 선택 기능이 아니라면 받지 않는 편이 좋습니다.

## 유지보수 루틴

앱을 활발히 쓰는 기간에는 주 1회 정도 다음을 확인합니다.

- 새 이슈 확인.
- 영향 큰 버그 재현.
- 의존성 보안 업데이트 확인.
- 릴리스 전 `corepack pnpm verify` 실행.
- 최소 모바일 1개, 데스크톱 1개 브라우저에서 설치/업데이트 확인.

저장소 구조나 백업 방식이 바뀌는 작업 전에는 다음을 확인합니다.

- 이전 버전에서 백업 파일을 내보냅니다.
- 새 버전에서 해당 백업을 가져옵니다.
- Markdown, HTML, 폴더, 읽기 위치가 유지되는지 확인합니다.
