// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { APP_VERSION } from "./appVersion"
import {
  isUpdateHistoryUnseen,
  LAST_SEEN_VERSION_STORAGE_KEY,
  markUpdateHistorySeen,
} from "./updateHistory"

describe("update history seen state", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it("moves from unseen to seen, then becomes unseen for a newer version", () => {
    expect(isUpdateHistoryUnseen(APP_VERSION)).toBe(true)

    markUpdateHistorySeen(APP_VERSION)

    expect(localStorage.getItem(LAST_SEEN_VERSION_STORAGE_KEY)).toBe(APP_VERSION)
    expect(isUpdateHistoryUnseen(APP_VERSION)).toBe(false)
    expect(isUpdateHistoryUnseen("v1.7.0")).toBe(true)
  })

  it("treats stale or malformed localStorage values as unseen", () => {
    localStorage.setItem(LAST_SEEN_VERSION_STORAGE_KEY, "v0.0.1")
    expect(isUpdateHistoryUnseen(APP_VERSION)).toBe(true)

    localStorage.setItem(LAST_SEEN_VERSION_STORAGE_KEY, "   ")
    expect(isUpdateHistoryUnseen(APP_VERSION)).toBe(true)
  })

  it("keeps storage failures non-blocking", () => {
    const storage = {
      getItem: () => {
        throw new Error("read failed")
      },
      setItem: () => {
        throw new Error("write failed")
      },
    }
    vi.stubGlobal("localStorage", storage)

    expect(isUpdateHistoryUnseen(APP_VERSION)).toBe(true)
    expect(() => markUpdateHistorySeen(APP_VERSION)).not.toThrow()
  })
})
