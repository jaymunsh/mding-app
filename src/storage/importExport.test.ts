import { describe, expect, it } from "vitest"
import {
  createSnapshotFromMarkdown,
  createWorkspaceBackupBlob,
  formatBackupDate,
  parseMarkdownFiles,
  parseWorkspaceBackupFile,
  parseWorkspaceBackupJson,
  readStoredZipEntryNames,
} from "./importExport"

describe("workspace import and export helpers", () => {
  it("reads only Markdown files from a mixed file selection", async () => {
    const markdown = new File(["# Hello"], "hello.md", { type: "text/markdown" })
    const markdownLong = new File(["# Long"], "hello.markdown", { type: "text/markdown" })
    const text = new File(["skip"], "notes.txt", { type: "text/plain" })

    const imports = await parseMarkdownFiles([markdown, markdownLong, text])

    expect(imports).toEqual([
      { name: "hello.md", markdown: "# Hello" },
      { name: "hello.markdown", markdown: "# Long" },
    ])
  })

  it("creates a valid snapshot from imported Markdown files", () => {
    const snapshot = createSnapshotFromMarkdown([{ name: "hello.md", markdown: "# Hello" }], null)

    expect(snapshot.nodes).toHaveLength(1)
    expect(snapshot.documents).toHaveLength(1)
    expect(snapshot.nodes[0]?.name).toBe("hello.md")
    expect(snapshot.documents[0]?.markdown).toBe("# Hello")
  })

  it("parses legacy JSON workspace backups at the input boundary", () => {
    const snapshot = createSnapshotFromMarkdown([{ name: "hello.md", markdown: "# Hello" }], null)

    expect(parseWorkspaceBackupJson(JSON.stringify(snapshot))).toEqual(snapshot)
  })

  it("creates zip backups with a manifest and Markdown files", async () => {
    const snapshot = createSnapshotFromMarkdown([{ name: "hello.md", markdown: "# Hello" }], null)

    const blob = createWorkspaceBackupBlob(snapshot)
    const names = readStoredZipEntryNames(await blob.arrayBuffer())

    expect(blob.type).toBe("application/zip")
    expect(names).toEqual(["manifest.json", "workspace/hello.md"])
  })

  it("restores workspace snapshots from zip backups", async () => {
    const snapshot = createSnapshotFromMarkdown([{ name: "hello.md", markdown: "# Hello" }], null)
    const blob = createWorkspaceBackupBlob(snapshot)
    const file = new File([blob], "mding-backup.zip", { type: "application/zip" })

    await expect(parseWorkspaceBackupFile(file)).resolves.toEqual(snapshot)
  })

  it("still restores workspace snapshots from legacy JSON backup files", async () => {
    const snapshot = createSnapshotFromMarkdown([{ name: "hello.md", markdown: "# Hello" }], null)
    const file = new File([JSON.stringify(snapshot)], "mding-backup.json", {
      type: "application/json",
    })

    await expect(parseWorkspaceBackupFile(file)).resolves.toEqual(snapshot)
  })

  it("formats backup filenames with stable calendar dates", () => {
    expect(formatBackupDate(new Date("2026-07-03T00:00:00.000Z"))).toBe("2026-07-03")
  })
})
