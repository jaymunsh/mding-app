import { X } from "lucide-react"
import { useEffect, useRef } from "react"
import { type AppLanguage, translate } from "../app/i18n"
import { RELEASE_HISTORY } from "../app/releaseNotes"

type UpdateHistoryDialogProps = {
  readonly appLanguage: AppLanguage
  readonly onClose: () => void
}

export function UpdateHistoryDialog({ appLanguage, onClose }: UpdateHistoryDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const t = (key: Parameters<typeof translate>[1]) => translate(appLanguage, key)
  const releaseHistory = RELEASE_HISTORY[appLanguage]

  useEffect(() => {
    const activeElement = document.activeElement
    returnFocusRef.current = activeElement instanceof HTMLElement ? activeElement : null
    closeButtonRef.current?.focus()

    return () => returnFocusRef.current?.focus()
  }, [])

  return (
    <div className="modal-overlay update-history-overlay">
      <button
        className="modal-backdrop"
        type="button"
        onClick={onClose}
        aria-label={t("closeUpdateHistory")}
      />
      <section
        className="update-history-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-history-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault()
            onClose()
          }
        }}
      >
        <header className="update-history-header">
          <div>
            <h2 id="update-history-title">{t("updateHistoryTitle")}</h2>
            <p>{t("updateHistoryDescription")}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={t("closeUpdateHistory")}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        <div className="update-history-content">
          {releaseHistory.map((release, index) => (
            <article
              className={index === 0 ? "update-history-release current" : "update-history-release"}
              key={release.version}
            >
              <div className="update-history-release-heading">
                <div className="update-history-release-title">
                  <h3>{release.version}</h3>
                  {index === 0 ? <span>{t("updateHistoryLatest")}</span> : null}
                </div>
                <time dateTime={release.date}>
                  {t("releaseDate")} {release.date}
                </time>
              </div>
              <p className="update-history-summary">{release.summary}</p>
              <h4>{t("releaseHighlights")}</h4>
              <ul>
                {release.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
