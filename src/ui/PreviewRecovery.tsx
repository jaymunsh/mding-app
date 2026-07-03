import { RefreshCw, RotateCcw } from "lucide-react"
import { Component, type ErrorInfo, type ReactNode } from "react"
import { type AppLanguage, translate } from "../app/i18n"

type PreviewFailureDescription = {
  readonly detail: string
  readonly title: string
}

type PreviewErrorBoundaryProps = {
  readonly appLanguage: AppLanguage
  readonly children: ReactNode
  readonly resetKey: string
}

type PreviewErrorBoundaryState = {
  readonly error: unknown
}

const INITIAL_STATE: PreviewErrorBoundaryState = {
  error: null,
}

export class PreviewErrorBoundary extends Component<
  PreviewErrorBoundaryProps,
  PreviewErrorBoundaryState
> {
  override state: PreviewErrorBoundaryState = INITIAL_STATE

  static getDerivedStateFromError(error: unknown): PreviewErrorBoundaryState {
    return { error }
  }

  override componentDidUpdate(previousProps: PreviewErrorBoundaryProps): void {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error !== null) {
      this.setState(INITIAL_STATE)
    }
  }

  override componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
    console.error("Preview failed to render", error, errorInfo.componentStack)
  }

  override render(): ReactNode {
    if (this.state.error === null) {
      return this.props.children
    }

    const failure = describePreviewFailure(this.state.error, this.props.appLanguage)
    const t = (key: Parameters<typeof translate>[1]) => translate(this.props.appLanguage, key)

    return (
      <div className="preview-error-panel" role="alert">
        <div>
          <h2>{failure.title}</h2>
          <p>{failure.detail}</p>
        </div>
        <div className="preview-error-actions">
          <button type="button" onClick={() => this.setState(INITIAL_STATE)}>
            <RotateCcw size={16} aria-hidden="true" />
            <span>{t("tryAgain")}</span>
          </button>
          <button type="button" className="primary" onClick={() => window.location.reload()}>
            <RefreshCw size={16} aria-hidden="true" />
            <span>{t("reloadApp")}</span>
          </button>
        </div>
      </div>
    )
  }
}

export function describePreviewFailure(
  error: unknown,
  appLanguage: AppLanguage = "en",
): PreviewFailureDescription {
  if (isPreviewChunkLoadError(error)) {
    return appLanguage === "ko"
      ? {
          detail:
            "미리보기 코드를 불러오지 못했습니다. 앱 업데이트 후에는 새로고침으로 해결되는 경우가 많습니다.",
          title: "미리보기를 새로고침해야 합니다",
        }
      : {
          detail:
            "The preview code could not be loaded. Reloading usually fixes this after an app update.",
          title: "Preview needs a reload",
        }
  }

  return appLanguage === "ko"
    ? {
        detail: "문서 미리보기가 예기치 않게 중단되었습니다. 다시 시도하거나 앱을 새로고침하세요.",
        title: "미리보기를 불러올 수 없습니다",
      }
    : {
        detail: "The document preview stopped unexpectedly. Try again or reload the app.",
        title: "Preview could not load",
      }
}

export function isPreviewChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  return /Failed to fetch dynamically imported module|Loading chunk \d+ failed|Importing a module script failed/i.test(
    error.message,
  )
}
