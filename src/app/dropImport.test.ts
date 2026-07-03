import { describe, expect, it } from "vitest"
import { classifyDroppedFiles, DropImportKind } from "./dropImport"

describe("dropped file classification", () => {
  it("returns none when no files are dropped", () => {
    expect(classifyDroppedFiles([])).toEqual({ kind: DropImportKind.None })
  })

  it("routes a single backup file to workspace import", () => {
    const backup = new File(["{}"], "mding-backup.json", { type: "application/json" })

    expect(classifyDroppedFiles([backup])).toEqual({
      kind: DropImportKind.Workspace,
      file: backup,
    })
  })

  it("routes document drops to document import", () => {
    const markdown = new File(["# Hello"], "hello.md", { type: "text/markdown" })
    const html = new File(["<h1>Hello</h1>"], "hello.html", { type: "text/html" })

    expect(classifyDroppedFiles([markdown, html])).toEqual({
      kind: DropImportKind.Documents,
      files: [markdown, html],
    })
  })
})
