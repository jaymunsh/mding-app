import { APP_VERSION } from "./appVersion"
import type { AppLanguage } from "./i18n"

export type ReleaseNote = {
  readonly version: string
  readonly date: string
  readonly summary: string
  readonly highlights: readonly string[]
}

const currentEnglishRelease = {
  version: APP_VERSION,
  date: "2026-07-18",
  summary: "A more capable local workspace with pinned shortcuts and focused reading.",
  highlights: [
    "Pin Markdown files as shortcuts without moving them in the workspace tree.",
    "Create named Markdown files and folders with validation and automatic `.md` completion.",
    "Drag files to folders or the root with clear destination feedback and success-only move confirmation.",
    "Use preview-only Focus reading for Markdown and HTML with desktop and mobile exit paths.",
    "Restore deleted items with the five-second Undo action and keep pinned metadata in backups.",
    "Use the bilingual Quick Guide, responsive sidebar controls, and compact toolbar overflow on smaller screens.",
  ],
} as const satisfies ReleaseNote

const currentKoreanRelease = {
  version: APP_VERSION,
  date: "2026-07-18",
  summary: "고정 바로가기와 집중 읽기를 더한 로컬 작업공간입니다.",
  highlights: [
    "Markdown 파일을 트리에서 옮기지 않고 바로가기로 고정할 수 있습니다.",
    "이름을 검증하고 `.md`를 자동 완성해 Markdown 파일과 폴더를 만들 수 있습니다.",
    "폴더나 루트에 파일을 끌어 놓으면 대상을 표시하고, 이동 성공 시에만 확인합니다.",
    "Markdown과 HTML 미리보기에서 데스크톱과 모바일에서 집중 읽기를 종료할 수 있습니다.",
    "삭제 후 5초 동안 실행 취소할 수 있고, 백업에 고정 메타데이터도 보존합니다.",
    "한영 빠른 가이드, 반응형 사이드바 조작, 좁은 화면용 도구 모음을 제공합니다.",
  ],
} as const satisfies ReleaseNote

const englishReleaseHistory = [
  currentEnglishRelease,
  {
    version: "v1.5.0",
    date: "2026-07-05",
    summary: "Search and document-preview tools make long Markdown files easier to use.",
    highlights: [
      "Search within Markdown documents with match navigation.",
      "Use preview zoom, reading progress, and more reliable HTML preview navigation.",
      "Refine the document toolbar and preview surface for a calmer writing desk.",
    ],
  },
  {
    version: "v1.2.0",
    date: "2026-07-04",
    summary: "Reading progress and preview polish improve continuity between sessions.",
    highlights: [
      "Remember each document's last reading position locally.",
      "Improve Markdown and HTML preview scrolling and mobile gestures.",
    ],
  },
  {
    version: "v1.0.0",
    date: "2026-07-03",
    summary: "The first local-first mding PWA release.",
    highlights: [
      "Create and edit Markdown files in a browser-local workspace.",
      "Preview read-only HTML files and render Markdown with tables, callouts, code, and Mermaid.",
      "Use themes, language settings, and workspace backup import/export without an account.",
    ],
  },
] as const satisfies readonly ReleaseNote[]

const koreanReleaseHistory = [
  currentKoreanRelease,
  {
    version: "v1.5.0",
    date: "2026-07-05",
    summary: "검색과 문서 미리보기 도구로 긴 Markdown 파일을 더 쉽게 사용할 수 있습니다.",
    highlights: [
      "Markdown 문서 안을 검색하고 결과 사이를 이동할 수 있습니다.",
      "미리보기 배율, 읽기 진행률, 더 안정적인 HTML 미리보기 탐색을 지원합니다.",
      "차분한 작성 화면을 위해 문서 도구 모음과 미리보기 화면을 다듬었습니다.",
    ],
  },
  {
    version: "v1.2.0",
    date: "2026-07-04",
    summary: "읽기 진행률과 미리보기 개선으로 세션 사이의 흐름을 이어 줍니다.",
    highlights: [
      "문서별 마지막 읽기 위치를 로컬에 기억합니다.",
      "Markdown·HTML 미리보기 스크롤과 모바일 제스처를 개선했습니다.",
    ],
  },
  {
    version: "v1.0.0",
    date: "2026-07-03",
    summary: "첫 번째 로컬 우선 mding PWA 릴리스입니다.",
    highlights: [
      "브라우저 로컬 작업공간에서 Markdown 파일을 만들고 편집할 수 있습니다.",
      "읽기 전용 HTML 파일을 미리보고 표, 콜아웃, 코드, Mermaid가 포함된 Markdown을 렌더링합니다.",
      "계정 없이 테마·언어 설정과 작업공간 백업 가져오기·내보내기를 사용할 수 있습니다.",
    ],
  },
] as const satisfies readonly ReleaseNote[]

export const RELEASE_HISTORY = {
  en: englishReleaseHistory,
  ko: koreanReleaseHistory,
} as const satisfies Record<AppLanguage, readonly ReleaseNote[]>

export function currentReleaseNote(language: AppLanguage): ReleaseNote {
  switch (language) {
    case "en":
      return currentEnglishRelease
    case "ko":
      return currentKoreanRelease
  }
}
