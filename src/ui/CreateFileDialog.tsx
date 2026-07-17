import { X } from "lucide-react"
import type { RefObject } from "react"
import { type AppLanguage, translate } from "../app/i18n"

export const CreateDialogKind = {
  File: "file",
  Folder: "folder",
} as const

export type CreateDialogKind = (typeof CreateDialogKind)[keyof typeof CreateDialogKind]

type CreateFileDialogProps = {
  readonly appLanguage: AppLanguage
  readonly inputRef: RefObject<HTMLInputElement | null>
  readonly kind: CreateDialogKind
  readonly name: string
  readonly onNameChange: (name: string) => void
  readonly onCancel: () => void
  readonly onCreate: () => void
}

export function isCreateDialogNameValid(kind: CreateDialogKind, name: string): boolean {
  const trimmedName = name.trim()
  if (
    trimmedName.length === 0 ||
    trimmedName === "." ||
    trimmedName === ".." ||
    trimmedName.includes("/") ||
    trimmedName.includes("\\")
  ) {
    return false
  }

  if (kind === CreateDialogKind.Folder) {
    return true
  }

  const extensionIndex = trimmedName.lastIndexOf(".")
  return extensionIndex < 0 || trimmedName.slice(extensionIndex).toLowerCase() === ".md"
}

export function CreateFileDialog({
  appLanguage,
  inputRef,
  kind,
  name,
  onNameChange,
  onCancel,
  onCreate,
}: CreateFileDialogProps) {
  const canCreate = isCreateDialogNameValid(kind, name)
  const hasInvalidName = name.trim().length > 0 && !canCreate
  const isFile = kind === CreateDialogKind.File
  const titleId = isFile ? "new-file-title" : "new-folder-title"
  const inputId = isFile ? "new-file-name" : "new-folder-name"
  const t = (key: Parameters<typeof translate>[1]) => translate(appLanguage, key)

  return (
    <div className="modal-overlay">
      <button
        className="modal-backdrop"
        type="button"
        onClick={onCancel}
        aria-label={t("cancel")}
      />
      <section className="name-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="name-dialog-header">
          <h2 id={titleId}>{isFile ? t("newMarkdownFile") : t("newFolder")}</h2>
          <button type="button" onClick={onCancel} aria-label={t("cancel")}>
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        <form
          className="name-dialog-form"
          onSubmit={(event) => {
            event.preventDefault()
            if (canCreate) {
              onCreate()
            }
          }}
        >
          <label htmlFor={inputId}>{isFile ? t("fileName") : t("folderName")}</label>
          <input
            id={inputId}
            ref={inputRef}
            type="text"
            value={name}
            placeholder={isFile ? "Notes.md" : "Notes"}
            aria-invalid={hasInvalidName}
            onChange={(event) => onNameChange(event.currentTarget.value)}
          />
          {hasInvalidName ? <p className="name-dialog-error">{t("invalidName")}</p> : null}
          {isFile && !hasInvalidName ? <p>{t("mdExtensionHelp")}</p> : null}
          <div className="name-dialog-actions">
            <button type="button" onClick={onCancel}>
              {t("cancel")}
            </button>
            <button className="primary" type="submit" disabled={!canCreate}>
              {t("create")}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
