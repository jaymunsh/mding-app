import {
  createNodeId,
  type NodeId,
  NodeKind,
  type WorkspaceSnapshot,
  WorkspaceSnapshotSchema,
} from "../domain/workspace"

export type MarkdownImport = {
  readonly name: string
  readonly markdown: string
}

const markdownExtensions = [".md", ".markdown"] as const

export function isMarkdownFilename(name: string): boolean {
  const normalizedName = name.toLowerCase()
  return markdownExtensions.some((extension) => normalizedName.endsWith(extension))
}

export async function parseMarkdownFiles(
  files: readonly File[],
): Promise<readonly MarkdownImport[]> {
  const markdownFiles = files.filter((file) => isMarkdownFilename(file.name))
  return Promise.all(
    markdownFiles.map(async (file) => ({
      name: file.name,
      markdown: await file.text(),
    })),
  )
}

export function parseWorkspaceBackup(rawJson: string): WorkspaceSnapshot {
  return WorkspaceSnapshotSchema.parse(JSON.parse(rawJson))
}

export function createMarkdownFileBlob(markdown: string): Blob {
  return new Blob([markdown], { type: "text/markdown;charset=utf-8" })
}

export function createWorkspaceBackupBlob(snapshot: WorkspaceSnapshot): Blob {
  return new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json;charset=utf-8" })
}

export function createSnapshotFromMarkdown(
  imports: readonly MarkdownImport[],
  parentId: NodeId | null,
): WorkspaceSnapshot {
  const now = Date.now()
  const nodes = imports.map((item) => {
    const id = createNodeId()
    return {
      node: {
        id,
        parentId,
        kind: NodeKind.File,
        name: item.name,
        createdAt: now,
        updatedAt: now,
      },
      document: {
        id,
        markdown: item.markdown,
        updatedAt: now,
      },
    }
  })

  return {
    nodes: nodes.map((item) => item.node),
    documents: nodes.map((item) => item.document),
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (!("storage" in navigator) || !("persist" in navigator.storage)) {
    return false
  }

  return navigator.storage.persist()
}

export function formatBackupDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
