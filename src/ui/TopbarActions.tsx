import {
  CircleHelp,
  Download,
  Ellipsis,
  FileInput,
  FilePlus2,
  FolderPlus,
  Upload,
} from "lucide-react"
import { useState } from "react"
import { type AppLanguage, translate } from "../app/i18n"

type TopbarActionsProps = {
  readonly appLanguage: AppLanguage
  readonly onCreateFolder: () => void
  readonly onCreateFile: () => void
  readonly onImportDocument: () => void
  readonly onImportWorkspace: () => void
  readonly onExportWorkspace: () => void
  readonly onOpenHelp: () => void
}

export function TopbarActions(props: TopbarActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const t = (key: Parameters<typeof translate>[1]) => translate(props.appLanguage, key)

  function runAction(action: () => void): void {
    action()
    setIsOpen(false)
  }

  return (
    <div className="toolbar-group">
      <ToolbarAction icon={FolderPlus} label={t("folder")} onClick={props.onCreateFolder} />
      <ToolbarAction icon={FilePlus2} label={t("file")} onClick={props.onCreateFile} />
      <ToolbarAction icon={FileInput} label={t("importFile")} onClick={props.onImportDocument} />
      <div className="wide-toolbar-actions">
        <ToolbarAction
          icon={Download}
          label={t("importBackup")}
          onClick={props.onImportWorkspace}
        />
        <ToolbarAction icon={Upload} label={t("backup")} onClick={props.onExportWorkspace} />
        <ToolbarAction icon={CircleHelp} label={t("guide")} onClick={props.onOpenHelp} />
      </div>
      <div className="toolbar-overflow-anchor">
        <button
          className={
            isOpen
              ? "toolbar-button toolbar-overflow-trigger selected"
              : "toolbar-button toolbar-overflow-trigger"
          }
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-label={t("moreActions")}
          aria-expanded={isOpen}
        >
          <Ellipsis size={17} aria-hidden="true" />
        </button>
        {isOpen ? (
          <div className="toolbar-overflow-menu" role="dialog" aria-label={t("moreActions")}>
            <button type="button" onClick={() => runAction(props.onImportWorkspace)}>
              <Download size={16} aria-hidden="true" />
              <span>{t("importBackup")}</span>
            </button>
            <button type="button" onClick={() => runAction(props.onExportWorkspace)}>
              <Upload size={16} aria-hidden="true" />
              <span>{t("backup")}</span>
            </button>
            <button type="button" onClick={() => runAction(props.onOpenHelp)}>
              <CircleHelp size={16} aria-hidden="true" />
              <span>{t("guide")}</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

type ToolbarActionProps = {
  readonly icon: typeof FolderPlus
  readonly label: string
  readonly onClick: () => void
}

function ToolbarAction({ icon: Icon, label, onClick }: ToolbarActionProps) {
  return (
    <button className="toolbar-button" type="button" onClick={onClick} aria-label={label}>
      <Icon size={17} aria-hidden="true" />
      <span>{label}</span>
    </button>
  )
}
