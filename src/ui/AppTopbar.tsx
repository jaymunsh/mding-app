import {
  CircleHelp,
  Download,
  FileInput,
  FilePlus2,
  FolderPlus,
  Monitor,
  Moon,
  Settings,
  Sun,
  Upload,
} from "lucide-react"
import { useState } from "react"
import {
  type AppLanguage,
  type LanguagePreference,
  LanguagePreference as LanguagePreferenceValue,
  translate,
} from "../app/i18n"
import { ThemePreference } from "../app/theme"

export const APP_VERSION = "v0.13"

type AppTopbarProps = {
  readonly appLanguage: AppLanguage
  readonly languagePreference: LanguagePreference
  readonly storagePersisted: boolean
  readonly themePreference: ThemePreference
  readonly onLanguagePreferenceChange: (preference: LanguagePreference) => void
  readonly onThemePreferenceChange: (preference: ThemePreference) => void
  readonly onCreateFolder: () => void
  readonly onCreateFile: () => void
  readonly onImportDocument: () => void
  readonly onImportWorkspace: () => void
  readonly onExportWorkspace: () => void
  readonly onOpenHelp: () => void
}

export function AppTopbar({
  appLanguage,
  languagePreference,
  storagePersisted,
  themePreference,
  onLanguagePreferenceChange,
  onThemePreferenceChange,
  onCreateFolder,
  onCreateFile,
  onImportDocument,
  onImportWorkspace,
  onExportWorkspace,
  onOpenHelp,
}: AppTopbarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const t = (key: Parameters<typeof translate>[1]) => translate(appLanguage, key)

  return (
    <header className="topbar">
      <div className="brand">
        <img className="brand-mark" src="/icons/icon.svg" alt="" aria-hidden="true" />
        <div>
          <div className="brand-title-row">
            <strong>mding</strong>
          </div>
          <span className="brand-subtitle">
            {storagePersisted ? t("persistentLocalStorage") : t("localWorkspace")}
          </span>
        </div>
      </div>
      <div className="toolbar-group">
        <button
          className="toolbar-button"
          type="button"
          onClick={onCreateFolder}
          aria-label={t("folder")}
        >
          <FolderPlus size={17} aria-hidden="true" />
          <span>{t("folder")}</span>
        </button>
        <button
          className="toolbar-button"
          type="button"
          onClick={onCreateFile}
          aria-label={t("file")}
        >
          <FilePlus2 size={17} aria-hidden="true" />
          <span>{t("file")}</span>
        </button>
        <button
          className="toolbar-button"
          type="button"
          onClick={onImportDocument}
          aria-label={t("importFile")}
        >
          <FileInput size={17} aria-hidden="true" />
          <span>{t("importFile")}</span>
        </button>
        <button
          className="toolbar-button"
          type="button"
          onClick={onImportWorkspace}
          aria-label={t("importBackup")}
        >
          <Upload size={17} aria-hidden="true" />
          <span>{t("importBackup")}</span>
        </button>
        <button
          className="toolbar-button"
          type="button"
          onClick={onExportWorkspace}
          aria-label={t("backup")}
        >
          <Download size={17} aria-hidden="true" />
          <span>{t("backup")}</span>
        </button>
        <button
          className="toolbar-button"
          type="button"
          onClick={onOpenHelp}
          aria-label={t("quickGuide")}
        >
          <CircleHelp size={17} aria-hidden="true" />
          <span>{t("guide")}</span>
        </button>
      </div>
      <div className="topbar-controls">
        <div className="settings-anchor">
          <button
            className={isSettingsOpen ? "settings-trigger selected" : "settings-trigger"}
            type="button"
            onClick={() => setIsSettingsOpen((current) => !current)}
            aria-label={t("settings")}
            aria-expanded={isSettingsOpen}
          >
            <Settings size={17} aria-hidden="true" />
          </button>
          {isSettingsOpen ? (
            <div className="settings-menu" role="dialog" aria-label={t("settings")}>
              <fieldset className="settings-section">
                <legend>{t("theme")}</legend>
                <div className="theme-switcher">
                  <button
                    className={themePreference === ThemePreference.System ? "selected" : ""}
                    type="button"
                    onClick={() => onThemePreferenceChange(ThemePreference.System)}
                    aria-label={t("useSystemTheme")}
                    title={t("system")}
                  >
                    <Monitor size={16} aria-hidden="true" />
                    <span>{t("system")}</span>
                  </button>
                  <button
                    className={themePreference === ThemePreference.Light ? "selected" : ""}
                    type="button"
                    onClick={() => onThemePreferenceChange(ThemePreference.Light)}
                    aria-label={t("useLightTheme")}
                    title={t("light")}
                  >
                    <Sun size={16} aria-hidden="true" />
                    <span>{t("light")}</span>
                  </button>
                  <button
                    className={themePreference === ThemePreference.Dark ? "selected" : ""}
                    type="button"
                    onClick={() => onThemePreferenceChange(ThemePreference.Dark)}
                    aria-label={t("useDarkTheme")}
                    title={t("dark")}
                  >
                    <Moon size={16} aria-hidden="true" />
                    <span>{t("dark")}</span>
                  </button>
                </div>
              </fieldset>
              <fieldset className="settings-section">
                <legend>{t("language")}</legend>
                <div className="language-switcher">
                  <button
                    className={
                      languagePreference === LanguagePreferenceValue.English ? "selected" : ""
                    }
                    type="button"
                    onClick={() => onLanguagePreferenceChange(LanguagePreferenceValue.English)}
                    aria-label={t("useEnglish")}
                  >
                    {t("english")}
                  </button>
                  <button
                    className={
                      languagePreference === LanguagePreferenceValue.Korean ? "selected" : ""
                    }
                    type="button"
                    onClick={() => onLanguagePreferenceChange(LanguagePreferenceValue.Korean)}
                    aria-label={t("useKorean")}
                  >
                    {t("korean")}
                  </button>
                </div>
              </fieldset>
              <div className="settings-version">
                <span>{APP_VERSION}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
