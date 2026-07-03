import { assertNever } from "../domain/result"
import {
  createNodeId,
  DocumentFormat,
  type DocumentFormat as DocumentFormatValue,
  type NodeId,
  NodeKind,
  type WorkspaceSnapshot,
} from "../domain/workspace"

export type MarkdownImport = {
  readonly name: string
  readonly markdown: string
}

export type DocumentFileImport = {
  readonly name: string
  readonly content: string
  readonly format: DocumentFormatValue
}

const markdownExtensions = [".md", ".markdown"] as const
const htmlExtensions = [".html", ".htm"] as const

export function isMarkdownFilename(name: string): boolean {
  const normalizedName = name.toLowerCase()
  return markdownExtensions.some((extension) => normalizedName.endsWith(extension))
}

export function isHtmlFilename(name: string): boolean {
  const normalizedName = name.toLowerCase()
  return htmlExtensions.some((extension) => normalizedName.endsWith(extension))
}

export function documentFilename(name: string, format: DocumentFormatValue): string {
  switch (format) {
    case DocumentFormat.Html:
      return isHtmlFilename(name) ? name : `${name}.html`
    case DocumentFormat.Markdown:
      return isMarkdownFilename(name) ? name : `${name}.md`
    default:
      return assertNever(format)
  }
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

export async function parseDocumentFiles(
  files: readonly File[],
): Promise<readonly DocumentFileImport[]> {
  const documentFiles = files.flatMap((file) => {
    const format = formatFromFilename(file.name)
    return format === null ? [] : [{ file, format }]
  })

  return Promise.all(
    documentFiles.map(async ({ file, format }) => ({
      name: file.name,
      content: await file.text(),
      format,
    })),
  )
}

export function createMarkdownFileBlob(markdown: string): Blob {
  return new Blob([markdown], { type: "text/markdown;charset=utf-8" })
}

export function createDocumentFileBlob(document: WorkspaceSnapshot["documents"][number]): Blob {
  switch (document.format) {
    case DocumentFormat.Html:
      return new Blob([document.markdown], { type: "text/html;charset=utf-8" })
    case DocumentFormat.Markdown:
      return createMarkdownFileBlob(document.markdown)
    default:
      return assertNever(document.format)
  }
}

export function createSnapshotFromMarkdown(
  imports: readonly MarkdownImport[],
  parentId: NodeId | null,
): WorkspaceSnapshot {
  return createSnapshotFromDocumentFiles(
    imports.map((item) => ({
      name: item.name,
      content: item.markdown,
      format: DocumentFormat.Markdown,
    })),
    parentId,
  )
}

export function createSnapshotFromDocumentFiles(
  imports: readonly DocumentFileImport[],
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
        markdown: item.content,
        format: item.format,
        updatedAt: now,
      },
    }
  })

  return {
    nodes: nodes.map((item) => item.node),
    documents: nodes.map((item) => item.document),
  }
}

function formatFromFilename(name: string): DocumentFormatValue | null {
  if (isMarkdownFilename(name)) {
    return DocumentFormat.Markdown
  }
  if (isHtmlFilename(name)) {
    return DocumentFormat.Html
  }
  return null
}
