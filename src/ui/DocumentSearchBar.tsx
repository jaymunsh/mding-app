import { ArrowDown, ArrowUp, X } from "lucide-react"
import { useEffect, useRef } from "react"
import { type AppLanguage, translate } from "../app/i18n"

type DocumentSearchBarProps = {
  readonly activeIndex: number
  readonly appLanguage: AppLanguage
  readonly count: number
  readonly query: string
  readonly onClose: () => void
  readonly onNext: () => void
  readonly onPrevious: () => void
  readonly onQueryChange: (query: string) => void
}

export function DocumentSearchBar({
  activeIndex,
  appLanguage,
  count,
  query,
  onClose,
  onNext,
  onPrevious,
  onQueryChange,
}: DocumentSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const t = (key: Parameters<typeof translate>[1]) => translate(appLanguage, key)
  const matchLabel =
    query.trim().length === 0 || count === 0 ? "0 / 0" : `${activeIndex + 1} / ${count}`

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <search className="document-search-bar">
      <input
        ref={inputRef}
        type="search"
        value={query}
        placeholder={t("searchInDocument")}
        aria-label={t("searchInDocument")}
        onChange={(event) => onQueryChange(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && event.shiftKey) {
            event.preventDefault()
            onPrevious()
          } else if (event.key === "Enter") {
            event.preventDefault()
            onNext()
          } else if (event.key === "Escape") {
            event.preventDefault()
            onClose()
          }
        }}
      />
      <span className="document-search-count" aria-live="polite">
        {matchLabel}
      </span>
      <button
        type="button"
        onClick={onPrevious}
        disabled={count === 0}
        aria-label={t("previousMatch")}
      >
        <ArrowUp size={15} aria-hidden="true" />
      </button>
      <button type="button" onClick={onNext} disabled={count === 0} aria-label={t("nextMatch")}>
        <ArrowDown size={15} aria-hidden="true" />
      </button>
      <button type="button" onClick={onClose} aria-label={t("closeSearch")}>
        <X size={15} aria-hidden="true" />
      </button>
    </search>
  )
}
