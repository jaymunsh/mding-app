import { X } from "lucide-react"

type HelpDialogProps = {
  readonly onClose: () => void
}

export function HelpDialog({ onClose }: HelpDialogProps) {
  return (
    <div className="modal-overlay help-overlay">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="Close guide" />
      <section className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <header className="help-header">
          <h2 id="help-title">Quick guide</h2>
          <button type="button" onClick={onClose} aria-label="Close guide">
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        <div className="help-content">
          <section className="help-section">
            <h3>Write</h3>
            <ul>
              <li>Create folders and Markdown files from the top toolbar.</li>
              <li>Open a Markdown file to preview it, then use Edit to change the source.</li>
              <li>Manage mode enables rename, move, and delete actions.</li>
            </ul>
          </section>
          <section className="help-section">
            <h3>Preview</h3>
            <ul>
              <li>
                Markdown supports tables, task lists, callouts, code blocks, Mermaid, and images by
                URL.
              </li>
              <li>HTML files are preview-only and keep their own layout inside the viewer.</li>
              <li>Zoom controls change the document scale without changing the saved file.</li>
            </ul>
          </section>
          <section className="help-section">
            <h3>Backup</h3>
            <ul>
              <li>Workspace data is stored in this browser or installed PWA.</li>
              <li>
                Backup exports a zip you can import again on iOS, iPadOS, macOS, or another browser.
              </li>
              <li>
                Back up before clearing site data, reinstalling the app, or switching devices.
              </li>
            </ul>
          </section>
        </div>
        <p className="help-note">
          Images are not stored locally; keep important image files or URLs separately.
        </p>
      </section>
    </div>
  )
}
