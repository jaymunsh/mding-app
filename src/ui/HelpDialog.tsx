import {
  CircleHelp,
  Download,
  FileInput,
  FilePlus2,
  FolderPlus,
  type LucideIcon,
  Settings,
  Upload,
  X,
} from "lucide-react"
import { type AppLanguage, type TranslationKey, translate } from "../app/i18n"

type HelpDialogProps = {
  readonly appLanguage: AppLanguage
  readonly onClose: () => void
}

const toolbarGuideItems: readonly {
  readonly icon: LucideIcon
  readonly textKey: TranslationKey
}[] = [
  { icon: FolderPlus, textKey: "helpToolbar1" },
  { icon: FilePlus2, textKey: "helpToolbar2" },
  { icon: FileInput, textKey: "helpToolbar3" },
  { icon: Download, textKey: "helpToolbar4" },
  { icon: Upload, textKey: "helpToolbar5" },
  { icon: CircleHelp, textKey: "helpToolbar6" },
  { icon: Settings, textKey: "helpToolbar7" },
] as const

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
            <h3>{t("helpToolbarTitle")}</h3>
            <ul className="help-toolbar-list">
              {toolbarGuideItems.map(({ icon: Icon, textKey }) => (
                <li className="help-toolbar-item" key={textKey}>
                  <span className="help-toolbar-icon">
                    <Icon size={14} aria-hidden="true" />
                  </span>
                  <span>{t(textKey)}</span>
                </li>
              ))}
            </ul>
          </section>
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
              <li>{t("helpPreview4")}</li>
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
