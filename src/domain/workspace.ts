import { z } from "zod"

export const NodeKind = {
  File: "file",
  Folder: "folder",
} as const

export type NodeKind = (typeof NodeKind)[keyof typeof NodeKind]

export const DocumentFormat = {
  Html: "html",
  Markdown: "markdown",
} as const

export type DocumentFormat = (typeof DocumentFormat)[keyof typeof DocumentFormat]

export const NodeIdSchema = z.string().uuid().brand<"NodeId">()
export type NodeId = z.infer<typeof NodeIdSchema>

type WorkspaceNodeFields = {
  readonly id: NodeId
  readonly parentId: NodeId | null
  readonly name: string
  readonly createdAt: number
  readonly updatedAt: number
}

export type WorkspaceFileNode = WorkspaceNodeFields & {
  readonly kind: typeof NodeKind.File
  readonly pinned?: boolean
}

export type WorkspaceFolderNode = WorkspaceNodeFields & {
  readonly kind: typeof NodeKind.Folder
}

export type WorkspaceNode = WorkspaceFileNode | WorkspaceFolderNode

export type WorkspaceDocument = {
  readonly id: NodeId
  readonly markdown: string
  readonly format: DocumentFormat
  readonly updatedAt: number
}

export type TreeNode = WorkspaceNode & {
  readonly children: readonly TreeNode[]
}

export type WorkspaceSnapshot = {
  readonly nodes: readonly WorkspaceNode[]
  readonly documents: readonly WorkspaceDocument[]
}

const WorkspaceNodeBaseSchema = z.object({
  id: NodeIdSchema,
  parentId: NodeIdSchema.nullable(),
  name: z.string().min(1),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
})

const WorkspaceFileNodeSchema = WorkspaceNodeBaseSchema.extend({
  kind: z.literal(NodeKind.File),
  pinned: z.boolean().default(false),
})

const WorkspaceFolderNodeSchema = WorkspaceNodeBaseSchema.extend({
  kind: z.literal(NodeKind.Folder),
}).strict()

export const WorkspaceNodeSchema = z.discriminatedUnion("kind", [
  WorkspaceFileNodeSchema,
  WorkspaceFolderNodeSchema,
])

export const WorkspaceDocumentSchema = z.object({
  id: NodeIdSchema,
  markdown: z.string(),
  format: z
    .union([z.literal(DocumentFormat.Html), z.literal(DocumentFormat.Markdown)])
    .default(DocumentFormat.Markdown),
  updatedAt: z.number().int().nonnegative(),
})

export const WorkspaceSnapshotSchema = z.object({
  nodes: z.array(WorkspaceNodeSchema),
  documents: z.array(WorkspaceDocumentSchema),
})

export function createNodeId(): NodeId {
  return NodeIdSchema.parse(crypto.randomUUID())
}

export function isMarkdownFile(node: WorkspaceNode): boolean {
  return node.kind === NodeKind.File && node.name.toLowerCase().endsWith(".md")
}

export function isEditableDocument(document: WorkspaceDocument | null): boolean {
  return document?.format === DocumentFormat.Markdown
}
