import { X } from "lucide-react"
import type { RefObject } from "react"
import { type AppLanguage, translate } from "../app/i18n"

type CreateFileDialogProps = {
  readonly appLanguage: AppLanguage
  readonly inputRef: RefObject<HTMLInputElement | null>
  readonly name: string
  readonly onNameChange: (name: string) => void
  readonly onCancel: () => void
  readonly onCreate: () => void
}

export function CreateFileDialog({
  appLanguage,
  inputRef,
  name,
  onNameChange,
  onCancel,
  onCreate,
}: CreateFileDialogProps) {
  const canCreate = name.trim().length > 0
  const t = (key: Parameters<typeof translate>[1]) => translate(appLanguage, key)

  return (
    <div className="modal-overlay">
      <button
        className="modal-backdrop"
        type="button"
        onClick={onCancel}
        aria-label={t("cancel")}
      />
      <section
        className="name-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-file-title"
      >
        <header className="name-dialog-header">
          <h2 id="new-file-title">{t("newMarkdownFile")}</h2>
          <button type="button" onClick={onCancel} aria-label={t("cancel")}>
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        <form
          className="name-dialog-form"
          onSubmit={(event) => {
            event.preventDefault()
            onCreate()
          }}
        >
          <label htmlFor="new-file-name">{t("fileName")}</label>
          <input
            id="new-file-name"
            ref={inputRef}
            type="text"
            value={name}
            placeholder="Notes.md"
            onChange={(event) => onNameChange(event.currentTarget.value)}
          />
          <p>{t("mdExtensionHelp")}</p>
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
