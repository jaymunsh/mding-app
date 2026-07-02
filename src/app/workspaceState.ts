import type { Dispatch, SetStateAction } from "react"
import type { NodeId, WorkspaceDocument, WorkspaceNode } from "../domain/workspace"

export const Screen = {
  Browser: "browser",
  Document: "document",
} as const

export type Screen = (typeof Screen)[keyof typeof Screen]

export type ControllerState = {
  readonly nodes: readonly WorkspaceNode[]
  readonly selectedId: NodeId | null
  readonly selectedDocument: WorkspaceDocument | null
  readonly editBuffer: string
  readonly isEditing: boolean
  readonly screen: Screen
  readonly errorMessage: string | null
  readonly storagePersisted: boolean
}

export type StateSetter = Dispatch<SetStateAction<ControllerState>>

export const initialState: ControllerState = {
  nodes: [],
  selectedId: null,
  selectedDocument: null,
  editBuffer: "",
  isEditing: false,
  screen: Screen.Browser,
  errorMessage: null,
  storagePersisted: false,
}

export function messageFromError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Unexpected workspace error."
}
