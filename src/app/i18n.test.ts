import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  formatEditedTime,
  LanguagePreference,
  readLanguagePreference,
  resolveAppLanguage,
  type TranslationKey,
  translate,
  translateAppMessage,
} from "./i18n"

const featureTranslationKeys = [
  "pinFile",
  "pinned",
  "unpinFile",
  "file",
  "folder",
  "newMarkdownFile",
  "newFolder",
  "fileName",
  "folderName",
  "invalidName",
  "mdExtensionHelp",
  "moveToFolder",
  "moveToRoot",
  "movedToFolder",
  "movedToRoot",
  "focusReading",
  "exitFocusReading",
  "helpWorkspace1",
  "helpWorkspace2",
  "helpWorkspace3",
  "helpWorkspace4",
  "helpWorkspace5",
  "helpWorkspace6",
] as const satisfies readonly TranslationKey[]

const featureErrorTranslations = [
  ["Choose a file or folder first.", "먼저 파일 또는 폴더를 선택하세요."],
  ["Choose a folder target.", "대상 폴더를 선택하세요."],
  ["Choose a different folder.", "다른 폴더를 선택하세요."],
  ["Cannot move into itself.", "자기 자신 안으로는 이동할 수 없습니다."],
  ["Selected item no longer exists.", "선택한 항목이 더 이상 존재하지 않습니다."],
  ["Select a file first.", "먼저 파일을 선택하세요."],
] as const

describe("i18n", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorageFake())
  })

  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it("defaults language preference to English", () => {
    expect(readLanguagePreference()).toBe(LanguagePreference.English)
  })

  it("normalizes the legacy system language preference to English", () => {
    localStorage.setItem("mding.language", LanguagePreference.System)

    expect(readLanguagePreference()).toBe(LanguagePreference.English)
  })

  it("falls back to English for a stale persisted language value", () => {
    localStorage.setItem("mding.language", "fr")

    expect(readLanguagePreference()).toBe(LanguagePreference.English)
  })

  it("resolves system language to Korean for Korean browser locales", () => {
    expect(resolveAppLanguage(LanguagePreference.System, ["ko-KR", "en-US"])).toBe("ko")
  })

  it("resolves system language to English for non-Korean browser locales", () => {
    expect(resolveAppLanguage(LanguagePreference.System, ["en-US", "ko-KR"])).toBe("en")
  })

  it("formats edited time with a 24-hour clock in Korean", () => {
    vi.setSystemTime(new Date("2026-07-03T18:19:00+09:00"))

    expect(formatEditedTime(new Date("2026-07-03T18:19:00+09:00").getTime(), "ko")).toBe(
      "수정됨 18:19",
    )
  })

  it("formats edited time with a 24-hour clock in English", () => {
    vi.setSystemTime(new Date("2026-07-03T18:19:00+09:00"))

    expect(formatEditedTime(new Date("2026-07-03T18:19:00+09:00").getTime(), "en")).toBe(
      "Edited 18:19",
    )
  })

  it("translates known app messages for Korean", () => {
    expect(translateAppMessage("ko", "HTML files are preview-only.")).toBe(
      "HTML 파일은 읽기 전용 미리보기만 지원합니다.",
    )
  })

  it("keeps app messages unchanged for English", () => {
    expect(translateAppMessage("en", "HTML files are preview-only.")).toBe(
      "HTML files are preview-only.",
    )
  })

  it("keeps every new feature label and guide entry populated in both languages", () => {
    for (const language of ["en", "ko"] as const) {
      for (const key of featureTranslationKeys) {
        const value = translate(language, key)
        expect(value.trim()).not.toBe("")
        expect(value).not.toBe(key)
      }
    }
  })

  it("translates every new move and selection error for Korean", () => {
    for (const [message, korean] of featureErrorTranslations) {
      expect(translateAppMessage("ko", message)).toBe(korean)
      expect(translateAppMessage("en", message)).toBe(message)
    }
  })
})

function createStorageFake(): Storage {
  const values = new Map<string, string>()
  return {
    get length() {
      return values.size
    },
    clear() {
      values.clear()
    },
    getItem(key: string) {
      return values.get(key) ?? null
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null
    },
    removeItem(key: string) {
      values.delete(key)
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
  }
}
