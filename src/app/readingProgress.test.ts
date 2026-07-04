import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  formatReadingProgressPercent,
  readReadingProgress,
  updateReadingProgress,
  writeReadingProgress,
} from "./readingProgress"

describe("reading progress", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorageFake())
  })

  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it("stores document progress locally without backup data coupling", () => {
    const progress = updateReadingProgress({}, "document-1", 0.428)

    writeReadingProgress(progress)

    expect(readReadingProgress()).toEqual({ "document-1": 0.428 })
  })

  it("removes near-top progress and clamps completed progress", () => {
    const progress = updateReadingProgress({ "document-1": 0.5 }, "document-1", 0.001)
    const completed = updateReadingProgress(progress, "document-2", 1.2)

    expect(completed).toEqual({ "document-2": 1 })
  })

  it("formats small list progress labels without showing idle zero", () => {
    expect(formatReadingProgressPercent(undefined)).toBeNull()
    expect(formatReadingProgressPercent(0.001)).toBeNull()
    expect(formatReadingProgressPercent(0.014)).toBe("1%")
    expect(formatReadingProgressPercent(0.426)).toBe("43%")
    expect(formatReadingProgressPercent(0.997)).toBe("100%")
  })

  it("keeps the same progress map when the visible progress barely changes", () => {
    const progress = { "document-1": 0.428 }

    expect(updateReadingProgress(progress, "document-1", 0.429)).toBe(progress)
    expect(updateReadingProgress({}, "document-1", 0.001)).toEqual({})
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
