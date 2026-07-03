import { RefreshCw, RotateCcw } from "lucide-react"
import { Component, type ErrorInfo, type ReactNode } from "react"

type PreviewFailureDescription = {
  readonly detail: string
  readonly title: string
}

type PreviewErrorBoundaryProps = {
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

    const failure = describePreviewFailure(this.state.error)

    return (
      <div className="preview-error-panel" role="alert">
        <div>
          <h2>{failure.title}</h2>
          <p>{failure.detail}</p>
        </div>
        <div className="preview-error-actions">
          <button type="button" onClick={() => this.setState(INITIAL_STATE)}>
            <RotateCcw size={16} aria-hidden="true" />
            <span>Try again</span>
          </button>
          <button type="button" className="primary" onClick={() => window.location.reload()}>
            <RefreshCw size={16} aria-hidden="true" />
            <span>Reload app</span>
          </button>
        </div>
      </div>
    )
  }
}

export function describePreviewFailure(error: unknown): PreviewFailureDescription {
  if (isPreviewChunkLoadError(error)) {
    return {
      detail:
        "The preview code could not be loaded. Reloading usually fixes this after an app update.",
      title: "Preview needs a reload",
    }
  }

  return {
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
