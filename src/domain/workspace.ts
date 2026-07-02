import { z } from "zod"

export const NodeKind = {
  File: "file",
  Folder: "folder",
} as const

export type NodeKind = (typeof NodeKind)[keyof typeof NodeKind]

export const NodeIdSchema = z.string().uuid().brand<"NodeId">()
export type NodeId = z.infer<typeof NodeIdSchema>

export type WorkspaceNode = {
  readonly id: NodeId
  readonly parentId: NodeId | null
  readonly kind: NodeKind
  readonly name: string
  readonly createdAt: number
  readonly updatedAt: number
}

export type WorkspaceDocument = {
  readonly id: NodeId
  readonly markdown: string
  readonly updatedAt: number
}

export type TreeNode = WorkspaceNode & {
  readonly children: readonly TreeNode[]
}

export type WorkspaceSnapshot = {
  readonly nodes: readonly WorkspaceNode[]
  readonly documents: readonly WorkspaceDocument[]
}

export const WorkspaceNodeSchema = z.object({
  id: NodeIdSchema,
  parentId: NodeIdSchema.nullable(),
  kind: z.union([z.literal(NodeKind.File), z.literal(NodeKind.Folder)]),
  name: z.string().min(1),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
})

export const WorkspaceDocumentSchema = z.object({
  id: NodeIdSchema,
  markdown: z.string(),
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
