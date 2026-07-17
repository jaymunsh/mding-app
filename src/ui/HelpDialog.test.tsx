// @vitest-environment happy-dom

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it } from "vitest"
import { type AppLanguage, translate } from "../app/i18n"
import { HelpDialog } from "./HelpDialog"

const roots: Root[] = []
const workspaceGuideKeys = [
  "helpWorkspaceTitle",
  "helpWorkspace1",
  "helpWorkspace2",
  "helpWorkspace3",
  "helpWorkspace4",
  "helpWorkspace5",
  "helpWorkspace6",
] as const

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => root.unmount())
  }
  document.body.replaceChildren()
})

describe("Quick Guide workspace guidance", () => {
  it("renders every new feature instruction in English and Korean", () => {
    for (const appLanguage of ["en", "ko"] as const) {
      const container = renderHelpDialog(appLanguage)
      const dialog = container.querySelector('[role="dialog"]')
      const guideText = dialog?.textContent ?? ""

      expect(dialog).not.toBeNull()
      for (const key of workspaceGuideKeys) {
        expect(guideText).toContain(translate(appLanguage, key))
      }
    }
  })

  it("keeps invalid move and editor focus guardrails visible in both languages", () => {
    for (const appLanguage of ["en", "ko"] as const) {
      const container = renderHelpDialog(appLanguage)
      const workspaceSection = Array.from(container.querySelectorAll(".help-section")).find(
        (section) =>
          section.querySelector("h3")?.textContent === translate(appLanguage, "helpWorkspaceTitle"),
      )

      expect(workspaceSection?.querySelectorAll("li")).toHaveLength(6)
    }
  })
})

function renderHelpDialog(appLanguage: AppLanguage): HTMLElement {
  const container = document.createElement("div")
  document.body.append(container)
  const root = createRoot(container)
  roots.push(root)

  act(() => {
    root.render(<HelpDialog appLanguage={appLanguage} onClose={() => {}} />)
  })

  return container
}
