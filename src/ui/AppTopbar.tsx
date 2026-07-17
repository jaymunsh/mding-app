import { History, Monitor, Moon, Settings, Sun, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { APP_VERSION } from "../app/appVersion"
import {
  type AppLanguage,
  formatBackupTime,
  type LanguagePreference,
  LanguagePreference as LanguagePreferenceValue,
  translate,
} from "../app/i18n"
import { ThemePreference } from "../app/theme"
import { TopbarActions } from "./TopbarActions"

type AppTopbarProps = {
  readonly appLanguage: AppLanguage
  readonly languagePreference: LanguagePreference
  readonly storagePersisted: boolean
  readonly lastBackupAt: number | null
  readonly themePreference: ThemePreference
  readonly isUpdateHistoryOpen: boolean
  readonly isUpdateHistoryUnseen: boolean
  readonly onLanguagePreferenceChange: (preference: LanguagePreference) => void
  readonly onThemePreferenceChange: (preference: ThemePreference) => void
  readonly onCreateFolder: () => void
  readonly onCreateFile: () => void
  readonly onImportDocument: () => void
  readonly onImportWorkspace: () => void
  readonly onExportWorkspace: () => void
  readonly onOpenHelp: () => void
  readonly onOpenUpdateHistory: () => void
  readonly onClearWorkspace: () => void
  readonly canClearWorkspace: boolean
}

export function AppTopbar({
  appLanguage,
  languagePreference,
  storagePersisted,
  lastBackupAt,
  themePreference,
  isUpdateHistoryOpen,
  isUpdateHistoryUnseen,
  onLanguagePreferenceChange,
  onThemePreferenceChange,
  onCreateFolder,
  onCreateFile,
  onImportDocument,
  onImportWorkspace,
  onExportWorkspace,
  onOpenHelp,
  onOpenUpdateHistory,
  onClearWorkspace,
  canClearWorkspace,
}: AppTopbarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [shouldRestoreUpdateHistoryFocus, setShouldRestoreUpdateHistoryFocus] = useState(false)
  const updateHistoryTriggerRef = useRef<HTMLButtonElement>(null)
  const t = (key: Parameters<typeof translate>[1]) => translate(appLanguage, key)

  useEffect(() => {
    if (isUpdateHistoryOpen || !shouldRestoreUpdateHistoryFocus) {
      return
    }

    setIsSettingsOpen(true)
  }, [isUpdateHistoryOpen, shouldRestoreUpdateHistoryFocus])

  useEffect(() => {
    if (isUpdateHistoryOpen || !shouldRestoreUpdateHistoryFocus || !isSettingsOpen) {
      return
    }

    updateHistoryTriggerRef.current?.focus()
    setShouldRestoreUpdateHistoryFocus(false)
  }, [isSettingsOpen, isUpdateHistoryOpen, shouldRestoreUpdateHistoryFocus])

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
      <TopbarActions
        appLanguage={appLanguage}
        onCreateFolder={onCreateFolder}
        onCreateFile={onCreateFile}
        onImportDocument={onImportDocument}
        onImportWorkspace={onImportWorkspace}
        onExportWorkspace={onExportWorkspace}
        onOpenHelp={onOpenHelp}
      />
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
                <span>
                  {t("lastBackup")}: {formatBackupTime(lastBackupAt, appLanguage)}
                </span>
                <button
                  ref={updateHistoryTriggerRef}
                  className="settings-update-history"
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen(false)
                    setShouldRestoreUpdateHistoryFocus(true)
                    onOpenUpdateHistory()
                  }}
                  aria-label={t("updateHistory")}
                >
                  <History size={15} aria-hidden="true" />
                  <span>{APP_VERSION}</span>
                  {isUpdateHistoryUnseen ? (
                    <span className="settings-update-badge">{t("newUpdate")}</span>
                  ) : null}
                </button>
              </div>
              <div className="settings-danger-zone">
                <p>{t("clearWorkspaceHelp")}</p>
                <button
                  className="danger"
                  type="button"
                  disabled={!canClearWorkspace}
                  onClick={() => {
                    if (window.confirm(t("clearWorkspaceConfirm"))) {
                      setIsSettingsOpen(false)
                      onClearWorkspace()
                    }
                  }}
                >
                  <Trash2 size={15} aria-hidden="true" />
                  <span>{t("clearWorkspace")}</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
