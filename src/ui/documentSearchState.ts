import type { Screen } from "../app/workspaceState"

type DocumentSearchResetSignalInput = {
  readonly isEditing: boolean
  readonly screen: Screen
  readonly selectedNodeId: string | null
}

export function createDocumentSearchResetSignal({
  isEditing,
  screen,
  selectedNodeId,
}: DocumentSearchResetSignalInput): string {
  const editorState = isEditing ? "editing" : "preview"
  return `${selectedNodeId ?? "none"}:${editorState}:${screen}`
}
