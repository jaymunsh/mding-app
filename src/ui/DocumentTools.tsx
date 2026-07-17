import { EllipsisVertical, Maximize2, Pencil, Upload, ZoomIn, ZoomOut } from "lucide-react"
import { useState } from "react"
import { type AppLanguage, translate } from "../app/i18n"

type DocumentToolsProps = {
  readonly appLanguage: AppLanguage
  readonly canEdit: boolean
  readonly canZoomIn: boolean
  readonly canZoomOut: boolean
  readonly exportLabel: string
  readonly zoom: number
  readonly onEdit: () => void
  readonly onExport: () => void
  readonly onFocusReading: () => void
  readonly onResetZoom: () => void
  readonly onZoomIn: () => void
  readonly onZoomOut: () => void
}

export function DocumentTools({
  appLanguage,
  canEdit,
  canZoomIn,
  canZoomOut,
  exportLabel,
  zoom,
  onEdit,
  onExport,
  onFocusReading,
  onResetZoom,
  onZoomIn,
  onZoomOut,
}: DocumentToolsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const t = (key: Parameters<typeof translate>[1]) => translate(appLanguage, key)

  function runAction(action: () => void): void {
    action()
    setIsOpen(false)
  }

  return (
    <div className="document-tools-anchor">
      <button
        className={isOpen ? "document-icon-button selected" : "document-icon-button"}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={t("documentTools")}
        aria-expanded={isOpen}
      >
        <EllipsisVertical size={17} aria-hidden="true" />
      </button>
      {isOpen ? (
        <div className="document-tools-menu" role="dialog" aria-label={t("documentTools")}>
          <PreviewZoomControls
            appLanguage={appLanguage}
            canZoomIn={canZoomIn}
            canZoomOut={canZoomOut}
            zoom={zoom}
            onReset={onResetZoom}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
          />
          <button type="button" onClick={() => runAction(onExport)} aria-label={exportLabel}>
            <Upload size={16} aria-hidden="true" />
            <span>{exportLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => runAction(onFocusReading)}
            aria-label={t("focusReading")}
          >
            <Maximize2 size={16} aria-hidden="true" />
            <span>{t("focusReading")}</span>
          </button>
          {canEdit ? (
            <button
              className="primary"
              type="button"
              onClick={() => runAction(onEdit)}
              aria-label={t("edit")}
            >
              <Pencil size={16} aria-hidden="true" />
              <span>{t("edit")}</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function PreviewZoomControls({
  zoom,
  canZoomOut,
  canZoomIn,
  appLanguage,
  onZoomOut,
  onZoomIn,
  onReset,
}: {
  readonly zoom: number
  readonly canZoomOut: boolean
  readonly canZoomIn: boolean
  readonly appLanguage: AppLanguage
  readonly onZoomOut: () => void
  readonly onZoomIn: () => void
  readonly onReset: () => void
}) {
  const zoomLabel = `${Math.round(zoom * 100)}%`
  const t = (key: Parameters<typeof translate>[1]) => translate(appLanguage, key)

  return (
    <fieldset className="preview-zoom-controls tool-preview-zoom-controls">
      <legend>{t("previewZoom")}</legend>
      <button type="button" onClick={onZoomOut} disabled={!canZoomOut} aria-label={t("zoomOut")}>
        <ZoomOut size={15} aria-hidden="true" />
      </button>
      <button type="button" onClick={onReset} aria-label={`${t("resetZoom")} ${zoomLabel}`}>
        {zoomLabel}
      </button>
      <button type="button" onClick={onZoomIn} disabled={!canZoomIn} aria-label={t("zoomIn")}>
        <ZoomIn size={15} aria-hidden="true" />
      </button>
    </fieldset>
  )
}
