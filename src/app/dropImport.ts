export const DropImportKind = {
  Documents: "documents",
  None: "none",
  Workspace: "workspace",
} as const

export type DropImportKind = (typeof DropImportKind)[keyof typeof DropImportKind]

export type DropImport =
  | {
      readonly kind: typeof DropImportKind.None
    }
  | {
      readonly kind: typeof DropImportKind.Documents
      readonly files: readonly File[]
    }
  | {
      readonly kind: typeof DropImportKind.Workspace
      readonly file: File
    }

export function classifyDroppedFiles(files: readonly File[]): DropImport {
  const [firstFile] = files
  if (firstFile === undefined) {
    return { kind: DropImportKind.None }
  }

  if (files.length === 1 && isWorkspaceBackupFile(firstFile)) {
    return { kind: DropImportKind.Workspace, file: firstFile }
  }

  return { kind: DropImportKind.Documents, files }
}

function isWorkspaceBackupFile(file: File): boolean {
  const lowerName = file.name.toLowerCase()
  return (
    lowerName.endsWith(".zip") ||
    lowerName.endsWith(".json") ||
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed" ||
    file.type === "application/json"
  )
}
