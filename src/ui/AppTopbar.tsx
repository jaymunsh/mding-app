import {
  CircleHelp,
  Download,
  FileInput,
  FilePlus2,
  FolderPlus,
  Monitor,
  Moon,
  Sun,
  Upload,
} from "lucide-react"
import { ThemePreference } from "../app/theme"

const APP_VERSION = "v0.12"

type AppTopbarProps = {
  readonly storagePersisted: boolean
  readonly themePreference: ThemePreference
  readonly onThemePreferenceChange: (preference: ThemePreference) => void
  readonly onCreateFolder: () => void
  readonly onCreateFile: () => void
  readonly onImportDocument: () => void
  readonly onImportWorkspace: () => void
  readonly onExportWorkspace: () => void
  readonly onOpenHelp: () => void
}

export function AppTopbar({
  storagePersisted,
  themePreference,
  onThemePreferenceChange,
  onCreateFolder,
  onCreateFile,
  onImportDocument,
  onImportWorkspace,
  onExportWorkspace,
  onOpenHelp,
}: AppTopbarProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <img className="brand-mark" src="/icons/icon.svg" alt="" aria-hidden="true" />
        <div>
          <div className="brand-title-row">
            <strong>mding</strong>
            <span className="app-version">{APP_VERSION}</span>
          </div>
          <span className="brand-subtitle">
            {storagePersisted ? "persistent local storage" : "local workspace"}
          </span>
        </div>
      </div>
      <div className="toolbar-group">
        <button
          className="toolbar-button"
          type="button"
          onClick={onCreateFolder}
          aria-label="Folder"
        >
          <FolderPlus size={17} aria-hidden="true" />
          <span>Folder</span>
        </button>
        <button className="toolbar-button" type="button" onClick={onCreateFile} aria-label="File">
          <FilePlus2 size={17} aria-hidden="true" />
          <span>File</span>
        </button>
        <button
          className="toolbar-button"
          type="button"
          onClick={onImportDocument}
          aria-label="Import file"
        >
          <FileInput size={17} aria-hidden="true" />
          <span>Import file</span>
        </button>
        <button
          className="toolbar-button"
          type="button"
          onClick={onImportWorkspace}
          aria-label="Import backup"
        >
          <Upload size={17} aria-hidden="true" />
          <span>Import backup</span>
        </button>
        <button
          className="toolbar-button"
          type="button"
          onClick={onExportWorkspace}
          aria-label="Backup"
        >
          <Download size={17} aria-hidden="true" />
          <span>Backup</span>
        </button>
        <button
          className="toolbar-button"
          type="button"
          onClick={onOpenHelp}
          aria-label="Quick guide"
        >
          <CircleHelp size={17} aria-hidden="true" />
          <span>Guide</span>
        </button>
      </div>
      <div className="topbar-controls">
        <fieldset className="theme-switcher">
          <legend>Theme</legend>
          <button
            className={themePreference === ThemePreference.System ? "selected" : ""}
            type="button"
            onClick={() => onThemePreferenceChange(ThemePreference.System)}
            aria-label="Use system theme"
            title="System"
          >
            <Monitor size={16} aria-hidden="true" />
          </button>
          <button
            className={themePreference === ThemePreference.Light ? "selected" : ""}
            type="button"
            onClick={() => onThemePreferenceChange(ThemePreference.Light)}
            aria-label="Use light theme"
            title="Light"
          >
            <Sun size={16} aria-hidden="true" />
          </button>
          <button
            className={themePreference === ThemePreference.Dark ? "selected" : ""}
            type="button"
            onClick={() => onThemePreferenceChange(ThemePreference.Dark)}
            aria-label="Use dark theme"
            title="Dark"
          >
            <Moon size={16} aria-hidden="true" />
          </button>
        </fieldset>
      </div>
    </header>
  )
}
