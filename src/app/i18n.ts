import { z } from "zod"

// allow: SIZE_OK — bilingual UI message catalog is intentionally one typed data table.

export const LanguagePreference = {
  System: "system",
  Korean: "ko",
  English: "en",
} as const

export type LanguagePreference = (typeof LanguagePreference)[keyof typeof LanguagePreference]
export type AppLanguage = Exclude<LanguagePreference, typeof LanguagePreference.System>

const LanguagePreferenceSchema = z.union([
  z.literal(LanguagePreference.System),
  z.literal(LanguagePreference.Korean),
  z.literal(LanguagePreference.English),
])

const languageStorageKey = "mding.language"

const englishMessages = {
  appAriaLabel: "mding workspace",
  back: "Back",
  backup: "Backup",
  cancel: "Cancel",
  closeSearch: "Close search",
  closeGuide: "Close guide",
  closeUpdateHistory: "Close update history",
  create: "Create",
  currentVersion: "Current version",
  createMarkdownStart: "Create a Markdown file to start.",
  delete: "Delete",
  dismiss: "Dismiss",
  document: "Document",
  documentTools: "Document tools",
  done: "Done",
  dark: "Dark",
  dropFilesToImport: "Drop files to import",
  edit: "Edit",
  emptyHtml: "This HTML file is empty.",
  emptyMarkdown: "This Markdown file is empty.",
  english: "English",
  exportHtml: "Export html",
  exportMd: "Export md",
  exitFocusReading: "Exit focused reading",
  file: "File",
  fileName: "File name",
  files: "Files",
  folder: "Folder",
  focusReading: "Focus reading",
  guide: "Guide",
  helpToolbar1: "Folder creates a folder in the current workspace location.",
  helpToolbar2: "File creates an editable Markdown file; `.md` is added when omitted.",
  helpToolbar3: "Import file accepts Markdown and HTML files only; HTML opens as preview-only.",
  helpToolbar4: "Import backup restores an mding backup zip by reading its manifest.json.",
  helpToolbar5: "Backup downloads the whole workspace as a restoreable zip file.",
  helpToolbar6: "Guide opens this help.",
  helpToolbar7:
    "Settings controls theme, language, version history, and confirmed workspace clearing.",
  helpToolbarTitle: "Top buttons",
  helpBackup1: "Workspace data is stored in this browser or installed PWA.",
  helpBackup2:
    "Backup downloads a zip with manifest.json for restore plus readable files under workspace/.",
  helpBackup3:
    "Import backup reads that zip automatically; document Export only downloads the open file.",
  helpBackupTitle: "Backup",
  helpNote: "Images are not stored locally; keep important image files or URLs separately.",
  helpPreview1:
    "Markdown supports tables, task lists, callouts, Mermaid, URL images, and highlighted code blocks for bash, css, go, html, java, js/jsx, json, markdown, python, rust, sql, swift, ts/tsx, and yaml.",
  helpPreview2: "HTML files are preview-only and keep their own layout inside the viewer.",
  helpPreview3: "Zoom controls change the document scale without changing the saved file.",
  helpPreview4:
    "The app remembers each document's last reading position locally and shows a small percent in the file list.",
  helpPreviewTitle: "Preview",
  helpWorkspace1:
    "Select files in Manage, open Move, then use Pin; pinned shortcuts appear in a separate workspace section without moving the originals.",
  helpWorkspace2:
    "Use Folder or File, enter a name, and `.md` is added to Markdown files when omitted.",
  helpWorkspace3:
    "Drag a file onto a folder or the root target; the target highlights before drop and a success message appears only after the move is saved.",
  helpWorkspace4:
    "Use Focus reading from document tools in preview mode. Escape, Android Back, iOS edge swipe, or the top-right exit button leaves focus before navigation.",
  helpWorkspace5: "Invalid drops keep the file where it is and show no move-success message.",
  helpWorkspace6: "Focus reading is preview-only; switch out of Edit mode before entering it.",
  helpWorkspaceTitle: "Shortcuts and focus",
  helpTitle: "Quick guide",
  helpWrite1: "Create folders and Markdown files from the top toolbar.",
  helpWrite2: "Open a Markdown file to preview it, then use Edit to change the source.",
  helpWrite3:
    "Manage mode supports multi-select move and delete. On desktop, drag files into folders; deleted items can be restored for 5 seconds.",
  helpWriteTitle: "Write",
  importBackup: "Import backup",
  importDocumentAria: "Import Markdown or HTML files",
  importFile: "Import file",
  importWorkspaceAria: "Import workspace backup",
  items: "items",
  korean: "한국어",
  language: "Language",
  latest: "Latest",
  light: "Light",
  loadingHtmlPreview: "Loading HTML preview...",
  loadingPreview: "Loading preview...",
  localWorkspace: "local workspace",
  lastBackup: "Last backup",
  manage: "Manage",
  markdownSource: "Markdown source",
  moreActions: "More actions",
  move: "Move",
  moveRoot: "Move root",
  moveToFolder: "Move to folder",
  moveToRoot: "Move to root",
  moveChooseFolderSuffix: "choose folder",
  movedToFolder: "Moved to folder",
  movedToRoot: "Moved to root",
  name: "Name",
  newMarkdownFile: "New Markdown file",
  newFolder: "New folder",
  newUpdate: "New update",
  folderName: "Folder name",
  invalidName: "Use a name without path separators; files must use the .md extension.",
  mdExtensionHelp: "`.md` is added automatically when omitted.",
  noDocumentAria: "No document selected",
  nextMatch: "Next match",
  persistentLocalStorage: "persistent local storage",
  pinFile: "Pin file",
  pinned: "Pinned",
  unpinFile: "Unpin file",
  previewZoom: "Preview zoom",
  previousMatch: "Previous match",
  quickGuide: "Quick guide",
  reloadApp: "Reload app",
  resizeSidebar: "Resize sidebar",
  rename: "Rename",
  renameSelected: "Rename selected",
  releaseDate: "Released",
  releaseHighlights: "Highlights",
  resetZoom: "Reset zoom to 100%, current",
  savedLocally: "Saved locally",
  save: "Save",
  selectFile: "Select a file",
  selectFileHelp: "Create Markdown files or import Markdown and HTML files to preview offline.",
  selectedForMove: "selected for move",
  selectedItem: "selected item",
  searchDocument: "Search document",
  searchInDocument: "Search in document...",
  settings: "Settings",
  clearWorkspace: "Clear workspace",
  clearWorkspaceHelp: "Delete every local file and folder. App settings are kept.",
  clearWorkspaceConfirm:
    "Delete every file and folder in this workspace? You can undo briefly after deletion.",
  system: "System",
  theme: "Theme",
  tryAgain: "Try again",
  unsavedChanges: "Unsaved changes",
  never: "Never",
  undo: "Undo",
  deletedItems: "items deleted",
  dismissNotification: "Dismiss notification",
  collapseSidebar: "Collapse sidebar",
  expandSidebar: "Expand sidebar",
  selectedCount: "selected",
  useDarkTheme: "Use dark theme",
  useEnglish: "Use English",
  useKorean: "Use Korean",
  useLightTheme: "Use light theme",
  useSystemLanguage: "Use system language",
  useSystemTheme: "Use system theme",
  updateHistory: "Update history",
  updateHistoryDescription: "See what's new in mding.",
  updateHistoryLatest: "Latest release",
  updateHistoryPrevious: "Previous releases",
  updateHistoryTitle: "Update history",
  version: "Version",
  workspace: "Workspace",
  workspaceFiles: "Workspace files",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
} as const

export type TranslationKey = keyof typeof englishMessages

const koreanMessages = {
  appAriaLabel: "mding 작업공간",
  back: "뒤로",
  backup: "백업",
  cancel: "취소",
  closeSearch: "검색 닫기",
  closeGuide: "가이드 닫기",
  closeUpdateHistory: "업데이트 기록 닫기",
  create: "생성",
  currentVersion: "현재 버전",
  createMarkdownStart: "시작하려면 Markdown 파일을 생성하세요.",
  delete: "삭제",
  dismiss: "닫기",
  document: "문서",
  documentTools: "문서 도구",
  done: "완료",
  dark: "다크",
  dropFilesToImport: "가져올 파일을 놓으세요",
  edit: "편집",
  emptyHtml: "이 HTML 파일은 비어 있습니다.",
  emptyMarkdown: "이 Markdown 파일은 비어 있습니다.",
  english: "English",
  exportHtml: "html 내보내기",
  exportMd: "md 내보내기",
  exitFocusReading: "집중 읽기 종료",
  file: "파일",
  fileName: "파일 이름",
  files: "파일",
  folder: "폴더",
  focusReading: "집중 읽기",
  guide: "가이드",
  helpToolbar1: "Folder는 현재 작업공간 위치에 폴더를 만듭니다.",
  helpToolbar2: "File은 편집 가능한 Markdown 파일을 만들며, 확장자를 생략하면 `.md`를 붙입니다.",
  helpToolbar3:
    "Import file은 Markdown과 HTML 파일만 가져오며, HTML은 읽기 전용 미리보기로 열립니다.",
  helpToolbar4: "Import backup은 mding 백업 zip의 manifest.json을 읽어 작업공간을 복원합니다.",
  helpToolbar5: "Backup은 전체 작업공간을 다시 가져올 수 있는 zip 파일로 내려받습니다.",
  helpToolbar6: "Guide는 이 도움말을 엽니다.",
  helpToolbar7: "설정에서는 테마, 언어, 업데이트 기록과 확인 후 작업공간 전체 삭제를 관리합니다.",
  helpToolbarTitle: "상단 버튼",
  helpBackup1: "작업공간 데이터는 이 브라우저 또는 설치된 PWA에 저장됩니다.",
  helpBackup2:
    "백업은 복원용 manifest.json과 확인 가능한 workspace/ 문서 파일을 담은 zip으로 내려받습니다.",
  helpBackup3:
    "백업 가져오기는 그 zip을 자동으로 읽어 복원하고, 문서 내보내기는 현재 열린 파일만 내려받습니다.",
  helpBackupTitle: "백업",
  helpNote: "이미지는 로컬에 저장하지 않습니다. 중요한 이미지 파일이나 URL은 따로 보관하세요.",
  helpPreview1:
    "Markdown은 표, 작업 목록, 콜아웃, Mermaid, URL 이미지와 bash, css, go, html, java, js/jsx, json, markdown, python, rust, sql, swift, ts/tsx, yaml 코드블럭 하이라이트를 지원합니다.",
  helpPreview2: "HTML 파일은 읽기 전용 미리보기이며 뷰어 안에서 자체 레이아웃을 유지합니다.",
  helpPreview3: "확대/축소는 저장된 파일을 바꾸지 않고 문서 표시 배율만 조정합니다.",
  helpPreview4:
    "문서별 마지막 읽기 위치를 로컬에 기억하고, 파일 목록에는 작은 퍼센트로 표시합니다.",
  helpPreviewTitle: "미리보기",
  helpWorkspace1:
    "관리에서 파일을 선택하고 이동을 연 뒤 고정을 누르세요. 원본 위치는 유지되며 별도의 고정 작업공간에 바로가기가 나타납니다.",
  helpWorkspace2:
    "Folder 또는 File을 누르고 이름을 입력하세요. Markdown 파일은 확장자를 생략하면 `.md`가 자동으로 붙습니다.",
  helpWorkspace3:
    "파일을 폴더나 루트 대상으로 끌면 놓기 전에 대상이 강조되고, 이동 저장이 완료된 뒤에만 성공 메시지가 표시됩니다.",
  helpWorkspace4:
    "미리보기의 문서 도구에서 집중 읽기를 시작하세요. 상단 우측 종료 버튼, Esc, Android 뒤로 가기 또는 iOS 가장자리 스와이프로 탐색 전에 집중 읽기를 종료할 수 있습니다.",
  helpWorkspace5: "잘못된 놓기는 파일을 이동하지 않고 이동 성공 메시지도 표시하지 않습니다.",
  helpWorkspace6: "집중 읽기는 미리보기 전용입니다. 편집 모드에서는 시작할 수 없습니다.",
  helpWorkspaceTitle: "바로가기와 집중 읽기",
  helpTitle: "빠른 가이드",
  helpWrite1: "상단 도구막대에서 폴더와 Markdown 파일을 만들 수 있습니다.",
  helpWrite2: "Markdown 파일을 열어 미리보고, 편집 버튼으로 원문을 수정합니다.",
  helpWrite3:
    "관리 모드에서 여러 항목을 선택해 이동·삭제할 수 있습니다. 데스크톱에서는 파일을 폴더로 끌어 옮길 수 있고, 삭제 후 5초 동안 되돌릴 수 있습니다.",
  helpWriteTitle: "작성",
  importBackup: "백업 가져오기",
  importDocumentAria: "Markdown 또는 HTML 파일 가져오기",
  importFile: "파일 가져오기",
  importWorkspaceAria: "작업공간 백업 가져오기",
  items: "개 항목",
  korean: "한국어",
  language: "언어",
  latest: "최신순",
  light: "라이트",
  loadingHtmlPreview: "HTML 미리보기 로딩 중...",
  loadingPreview: "미리보기 로딩 중...",
  localWorkspace: "로컬 작업공간",
  lastBackup: "마지막 백업",
  manage: "관리",
  markdownSource: "Markdown 원문",
  moreActions: "더보기",
  move: "이동",
  moveRoot: "루트로 이동",
  moveToFolder: "폴더로 이동",
  moveToRoot: "루트로 이동",
  moveChooseFolderSuffix: "폴더 선택",
  movedToFolder: "폴더로 이동했습니다",
  movedToRoot: "루트로 이동했습니다",
  name: "이름순",
  newMarkdownFile: "새 Markdown 파일",
  newFolder: "새 폴더",
  newUpdate: "새 업데이트",
  folderName: "폴더 이름",
  invalidName: "경로 구분자 없이 입력하고, 파일은 .md 확장자만 사용할 수 있습니다.",
  mdExtensionHelp: "확장자를 생략하면 `.md`가 자동으로 붙습니다.",
  noDocumentAria: "선택된 문서 없음",
  nextMatch: "다음 결과",
  persistentLocalStorage: "영구 로컬 저장소",
  pinFile: "파일 고정",
  pinned: "고정됨",
  unpinFile: "파일 고정 해제",
  previewZoom: "미리보기 배율",
  previousMatch: "이전 결과",
  quickGuide: "빠른 가이드",
  reloadApp: "앱 새로고침",
  resizeSidebar: "사이드바 크기 조절",
  rename: "이름 변경",
  renameSelected: "선택 항목 이름 변경",
  releaseDate: "출시일",
  releaseHighlights: "주요 내용",
  resetZoom: "100%로 배율 초기화, 현재",
  savedLocally: "로컬에 저장됨",
  save: "저장",
  selectFile: "파일을 선택하세요",
  selectFileHelp: "Markdown 파일을 만들거나 Markdown/HTML 파일을 가져와 오프라인으로 미리보세요.",
  selectedForMove: "개 이동 선택됨",
  selectedItem: "선택 항목",
  searchDocument: "문서 검색",
  searchInDocument: "문서에서 검색...",
  settings: "설정",
  clearWorkspace: "전체 파일 지우기",
  clearWorkspaceHelp: "로컬 파일과 폴더를 모두 삭제합니다. 앱 설정은 유지됩니다.",
  clearWorkspaceConfirm:
    "이 작업공간의 모든 파일과 폴더를 삭제할까요? 삭제 직후 잠시 실행 취소할 수 있습니다.",
  system: "시스템",
  theme: "테마",
  tryAgain: "다시 시도",
  unsavedChanges: "저장되지 않은 변경사항",
  never: "없음",
  undo: "실행 취소",
  deletedItems: "개 항목 삭제됨",
  dismissNotification: "알림 닫기",
  collapseSidebar: "사이드바 접기",
  expandSidebar: "사이드바 펼치기",
  selectedCount: "개 선택",
  useDarkTheme: "다크 테마 사용",
  useEnglish: "영어 사용",
  useKorean: "한국어 사용",
  useLightTheme: "라이트 테마 사용",
  useSystemLanguage: "시스템 언어 사용",
  useSystemTheme: "시스템 테마 사용",
  updateHistory: "업데이트 기록",
  updateHistoryDescription: "mding의 새로운 기능을 확인하세요.",
  updateHistoryLatest: "최신 릴리스",
  updateHistoryPrevious: "이전 릴리스",
  updateHistoryTitle: "업데이트 기록",
  version: "버전",
  workspace: "작업공간",
  workspaceFiles: "작업공간 파일",
  zoomIn: "확대",
  zoomOut: "축소",
} as const satisfies Record<TranslationKey, string>

const messages = {
  en: englishMessages,
  ko: koreanMessages,
} as const

export function translate(language: AppLanguage, key: TranslationKey): string {
  return messages[language][key]
}

const appMessageTranslations: Record<string, string> = {
  "Backup zip is missing manifest.json.": "백업 zip에 manifest.json이 없습니다.",
  "Cannot move into itself.": "자기 자신 안으로는 이동할 수 없습니다.",
  "Choose a different folder.": "다른 폴더를 선택하세요.",
  "Choose a file or folder and enter a name.": "파일 또는 폴더를 선택하고 이름을 입력하세요.",
  "Choose a file or folder first.": "먼저 파일 또는 폴더를 선택하세요.",
  "Choose a folder target.": "대상 폴더를 선택하세요.",
  "HTML files are preview-only.": "HTML 파일은 읽기 전용 미리보기만 지원합니다.",
  "Invalid zip backup.": "올바른 백업 zip이 아닙니다.",
  "Only stored mding zip backups are supported.": "mding에서 만든 stored zip 백업만 지원합니다.",
  "Select a file first.": "먼저 파일을 선택하세요.",
  "Selected item no longer exists.": "선택한 항목이 더 이상 존재하지 않습니다.",
  "Unsupported zip backup format.": "지원하지 않는 백업 zip 형식입니다.",
}

export function translateAppMessage(language: AppLanguage, message: string): string {
  if (language === LanguagePreference.English) {
    return message
  }
  return appMessageTranslations[message] ?? message
}

export function readLanguagePreference(): LanguagePreference {
  const parsedPreference = LanguagePreferenceSchema.catch(LanguagePreference.English).parse(
    localStorage.getItem(languageStorageKey),
  )
  return parsedPreference === LanguagePreference.System
    ? LanguagePreference.English
    : parsedPreference
}

export function saveLanguagePreference(preference: LanguagePreference): void {
  localStorage.setItem(languageStorageKey, preference)
}

export function resolveAppLanguage(
  preference: LanguagePreference,
  browserLanguages: readonly string[] = navigator.languages,
): AppLanguage {
  if (preference !== LanguagePreference.System) {
    return preference
  }

  return (browserLanguages[0] ?? "").toLowerCase().startsWith("ko")
    ? LanguagePreference.Korean
    : LanguagePreference.English
}

export function formatEditedTime(timestamp: number, language: AppLanguage): string {
  const date = new Date(timestamp)
  const now = new Date()
  const prefix = language === LanguagePreference.Korean ? "수정됨" : "Edited"

  if (date.toDateString() === now.toDateString()) {
    return `${prefix} ${timeFormatter(language).format(date)}`
  }
  if (date.getFullYear() === now.getFullYear()) {
    return `${prefix} ${dayFormatter(language).format(date)}`
  }
  return `${prefix} ${dateFormatter(language).format(date)}`
}

export function formatBackupTime(timestamp: number | null, language: AppLanguage): string {
  if (timestamp === null) {
    return translate(language, "never")
  }
  return formatEditedTime(timestamp, language)
    .replace(language === "ko" ? "수정됨" : "Edited", "")
    .trim()
}

function timeFormatter(language: AppLanguage): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(localeForLanguage(language), {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  })
}

function dayFormatter(language: AppLanguage): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(localeForLanguage(language), {
    day: "numeric",
    month: "short",
  })
}

function dateFormatter(language: AppLanguage): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(localeForLanguage(language), {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function localeForLanguage(language: AppLanguage): string {
  return language === LanguagePreference.Korean ? "ko-KR" : "en-US"
}
