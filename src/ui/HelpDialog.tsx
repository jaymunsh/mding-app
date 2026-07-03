import { X } from "lucide-react"
import { type AppLanguage, translate } from "../app/i18n"

type HelpDialogProps = {
  readonly appLanguage: AppLanguage
  readonly onClose: () => void
}

export function HelpDialog({ appLanguage, onClose }: HelpDialogProps) {
  const t = (key: Parameters<typeof translate>[1]) => translate(appLanguage, key)

  return (
    <div className="modal-overlay help-overlay">
      <button
        className="modal-backdrop"
        type="button"
        onClick={onClose}
        aria-label={t("closeGuide")}
      />
      <section className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <header className="help-header">
          <h2 id="help-title">{t("helpTitle")}</h2>
          <button type="button" onClick={onClose} aria-label={t("closeGuide")}>
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        <div className="help-content">
          <section className="help-section">
            <h3>{t("helpWriteTitle")}</h3>
            <ul>
              <li>{t("helpWrite1")}</li>
              <li>{t("helpWrite2")}</li>
              <li>{t("helpWrite3")}</li>
            </ul>
          </section>
          <section className="help-section">
            <h3>{t("helpPreviewTitle")}</h3>
            <ul>
              <li>{t("helpPreview1")}</li>
              <li>{t("helpPreview2")}</li>
              <li>{t("helpPreview3")}</li>
            </ul>
          </section>
          <section className="help-section">
            <h3>{t("helpBackupTitle")}</h3>
            <ul>
              <li>{t("helpBackup1")}</li>
              <li>{t("helpBackup2")}</li>
              <li>{t("helpBackup3")}</li>
            </ul>
          </section>
        </div>
        <p className="help-note">{t("helpNote")}</p>
      </section>
    </div>
  )
}
