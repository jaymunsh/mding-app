import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  formatEditedTime,
  LanguagePreference,
  readLanguagePreference,
  resolveAppLanguage,
  translateAppMessage,
} from "./i18n"

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
