import { X } from "lucide-react"
import type { RefObject } from "react"

type CreateFileDialogProps = {
  readonly inputRef: RefObject<HTMLInputElement | null>
  readonly name: string
  readonly onNameChange: (name: string) => void
  readonly onCancel: () => void
  readonly onCreate: () => void
}

export function CreateFileDialog({
  inputRef,
  name,
  onNameChange,
  onCancel,
  onCreate,
}: CreateFileDialogProps) {
  const canCreate = name.trim().length > 0

  return (
    <div className="modal-overlay">
      <button className="modal-backdrop" type="button" onClick={onCancel} aria-label="Cancel" />
      <section
        className="name-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-file-title"
      >
        <header className="name-dialog-header">
          <h2 id="new-file-title">New Markdown file</h2>
          <button type="button" onClick={onCancel} aria-label="Cancel">
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
          <label htmlFor="new-file-name">File name</label>
          <input
            id="new-file-name"
            ref={inputRef}
            type="text"
            value={name}
            placeholder="Notes.md"
            onChange={(event) => onNameChange(event.currentTarget.value)}
          />
          <p>`.md` is added automatically when omitted.</p>
          <div className="name-dialog-actions">
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
            <button className="primary" type="submit" disabled={!canCreate}>
              Create
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
