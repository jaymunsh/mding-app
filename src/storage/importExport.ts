import {
  createNodeId,
  type NodeId,
  NodeKind,
  type WorkspaceSnapshot,
  WorkspaceSnapshotSchema,
} from "../domain/workspace"
import { createStoredZipBlob, readStoredZipEntries, readStoredZipEntryNames } from "./zip"

export { readStoredZipEntryNames }

export type MarkdownImport = {
  readonly name: string
  readonly markdown: string
}

type MarkdownZipEntry = {
  readonly path: string
  readonly markdown: string
}

const markdownExtensions = [".md", ".markdown"] as const
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

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

export async function parseWorkspaceBackupFile(file: File): Promise<WorkspaceSnapshot> {
  if (isZipBackupFile(file)) {
    return parseWorkspaceBackupZip(await file.arrayBuffer())
  }

  return parseWorkspaceBackupJson(await file.text())
}

export function parseWorkspaceBackupJson(rawJson: string): WorkspaceSnapshot {
  return WorkspaceSnapshotSchema.parse(JSON.parse(rawJson))
}

export function parseWorkspaceBackupZip(buffer: ArrayBuffer): WorkspaceSnapshot {
  const manifest = readStoredZipEntries(buffer).find((entry) => entry.path === "manifest.json")
  if (manifest === undefined) {
    throw new Error("Backup zip is missing manifest.json.")
  }

  return parseWorkspaceBackupJson(textDecoder.decode(manifest.content))
}

export function createMarkdownFileBlob(markdown: string): Blob {
  return new Blob([markdown], { type: "text/markdown;charset=utf-8" })
}

export function createWorkspaceBackupBlob(snapshot: WorkspaceSnapshot): Blob {
  return createStoredZipBlob([
    {
      path: "manifest.json",
      content: textEncoder.encode(JSON.stringify(snapshot, null, 2)),
    },
    ...createMarkdownZipEntries(snapshot).map((entry) => ({
      path: entry.path,
      content: textEncoder.encode(entry.markdown),
    })),
  ])
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

function isZipBackupFile(file: File): boolean {
  const lowerName = file.name.toLowerCase()
  return (
    lowerName.endsWith(".zip") ||
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed"
  )
}

function createMarkdownZipEntries(snapshot: WorkspaceSnapshot): readonly MarkdownZipEntry[] {
  const nodesById = new Map(snapshot.nodes.map((node) => [node.id, node]))
  const documentsById = new Map(snapshot.documents.map((document) => [document.id, document]))
  const usedPaths = new Set<string>()

  return snapshot.nodes.flatMap((node) => {
    if (node.kind !== NodeKind.File) {
      return []
    }

    const document = documentsById.get(node.id)
    if (document === undefined) {
      return []
    }

    const path = uniqueZipPath(markdownZipPath(node.id, nodesById), usedPaths)
    return [{ path, markdown: document.markdown }]
  })
}

function markdownZipPath(
  nodeId: NodeId,
  nodesById: ReadonlyMap<NodeId, WorkspaceSnapshot["nodes"][number]>,
): string {
  const parts: string[] = []
  let currentId: NodeId | null = nodeId

  while (currentId !== null) {
    const node = nodesById.get(currentId)
    if (node === undefined) {
      break
    }

    const name = currentId === nodeId ? markdownFilename(node.name) : node.name
    parts.unshift(sanitizeZipSegment(name))
    currentId = node.parentId
  }

  return `workspace/${parts.join("/")}`
}

function markdownFilename(name: string): string {
  return isMarkdownFilename(name) ? name : `${name}.md`
}

function sanitizeZipSegment(segment: string): string {
  const sanitized = segment.replace(/[\\/]/g, "-").trim()
  return sanitized.length === 0 ? "Untitled.md" : sanitized
}

function uniqueZipPath(path: string, usedPaths: Set<string>): string {
  if (!usedPaths.has(path)) {
    usedPaths.add(path)
    return path
  }

  const extensionStart = path.lastIndexOf(".")
  const stem = extensionStart > 0 ? path.slice(0, extensionStart) : path
  const extension = extensionStart > 0 ? path.slice(extensionStart) : ""
  let counter = 2
  let candidate = `${stem}-${counter}${extension}`

  while (usedPaths.has(candidate)) {
    counter += 1
    candidate = `${stem}-${counter}${extension}`
  }

  usedPaths.add(candidate)
  return candidate
}
