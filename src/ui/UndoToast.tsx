import { Undo2, X } from "lucide-react"
import { type AppLanguage, translate } from "../app/i18n"

type UndoToastProps = {
  readonly appLanguage: AppLanguage
  readonly count: number
  readonly onDismiss: () => void
  readonly onUndo: () => void
}

export function UndoToast({ appLanguage, count, onDismiss, onUndo }: UndoToastProps) {
  const t = (key: Parameters<typeof translate>[1]) => translate(appLanguage, key)

  return (
    <div className="undo-toast" role="status" aria-live="polite">
      <span>
        {count}
        {appLanguage === "ko" ? "" : " "}
        {t("deletedItems")}
      </span>
      <button type="button" onClick={onUndo}>
        <Undo2 size={15} aria-hidden="true" />
        {t("undo")}
      </button>
      <button
        className="undo-toast-dismiss"
        type="button"
        onClick={onDismiss}
        aria-label={t("dismissNotification")}
      >
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  )
}
