import { describe, expect, it } from "vitest"
import { scrollRatio, scrollTopForRatio } from "./useScrollProgress"

describe("scroll progress", () => {
  it("calculates scroll ratio from an element", () => {
    const element = createScrollElement({ clientHeight: 200, scrollHeight: 1000, scrollTop: 400 })

    expect(scrollRatio(element)).toBe(0.5)
  })

  it("calculates scroll top from a saved ratio", () => {
    const element = createScrollElement({ clientHeight: 200, scrollHeight: 1000, scrollTop: 0 })

    expect(scrollTopForRatio(element, 0.5)).toBe(400)
    expect(scrollTopForRatio(element, 1.5)).toBe(800)
  })

  it("returns zero for non-scrollable content", () => {
    const element = createScrollElement({ clientHeight: 200, scrollHeight: 120, scrollTop: 40 })

    expect(scrollRatio(element)).toBe(0)
    expect(scrollTopForRatio(element, 0.5)).toBe(0)
  })
})

function createScrollElement({
  clientHeight,
  scrollHeight,
  scrollTop,
}: {
  readonly clientHeight: number
  readonly scrollHeight: number
  readonly scrollTop: number
}) {
  return { clientHeight, scrollHeight, scrollTop }
}
