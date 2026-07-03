import { Children, isValidElement, type ReactNode } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { HighlightedCode } from "./CodeHighlight"
import { MermaidDiagram } from "./MermaidPreview"

type MarkdownPreviewProps = {
  readonly markdown: string
}

const CALLOUT_LABELS = {
  bug: "Bug",
  caution: "Caution",
  danger: "Danger",
  example: "Example",
  failure: "Failure",
  info: "Info",
  note: "Note",
  question: "Question",
  quote: "Quote",
  success: "Success",
  tip: "Tip",
  warning: "Warning",
} as const

const CALLOUT_ALIASES: Readonly<Record<string, keyof typeof CALLOUT_LABELS>> = {
  abstract: "note",
  attention: "warning",
  check: "success",
  cite: "quote",
  done: "success",
  error: "danger",
  fail: "failure",
  faq: "question",
  help: "question",
  hint: "tip",
  important: "warning",
  missing: "failure",
  success: "success",
  summary: "note",
  tldr: "note",
  todo: "info",
  warn: "warning",
} as const

type CalloutKind = keyof typeof CALLOUT_LABELS
type CalloutFold = "none" | "open" | "closed"

export type ParsedCalloutMarker = {
  readonly fold: CalloutFold
  readonly kind: CalloutKind
  readonly title: string
}

type ParsedCallout = {
  readonly bodyText: string
  readonly marker: ParsedCalloutMarker
  readonly rest: readonly ReactNode[]
}

export function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
  return (
    <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
      {markdown}
    </ReactMarkdown>
  )
}

const markdownComponents = {
  a({ children, href }) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    )
  },
  code({ children, className }) {
    const language = parseCodeLanguage(className)
    const source = String(children).replace(/\n$/, "")

    if (language === "mermaid") {
      return <MermaidDiagram chart={source} />
    }

    if (language !== null) {
      return <HighlightedCode className={className} language={language} source={source} />
    }

    return <code className={className}>{children}</code>
  },
  blockquote({ children }) {
    const callout = parseCalloutChildren(children)

    if (callout === null) {
      return <blockquote>{children}</blockquote>
    }

    return <CalloutBlock callout={callout} />
  },
} satisfies Components

export function parseCodeLanguage(className: string | undefined): string | null {
  const languageClass = className?.split(/\s+/).find((name) => name.startsWith("language-"))
  return languageClass?.slice("language-".length).toLowerCase() ?? null
}

export function parseCalloutMarker(marker: string): ParsedCalloutMarker | null {
  const match = marker.trim().match(/^\[!([A-Za-z][A-Za-z0-9_-]*)\]([+-])?(?:\s+(.+))?$/)
  if (match === null) {
    return null
  }

  return {
    fold: parseFold(match[2]),
    kind: normalizeCalloutKind(match[1] ?? ""),
    title: match[3]?.trim() ?? "",
  }
}

function parseFold(marker: string | undefined): CalloutFold {
  if (marker === "+") {
    return "open"
  }
  if (marker === "-") {
    return "closed"
  }
  return "none"
}

function normalizeCalloutKind(rawKind: string): CalloutKind {
  const normalized = rawKind.toLowerCase()

  if (isCalloutKind(normalized)) {
    return normalized
  }

  return CALLOUT_ALIASES[normalized] ?? "note"
}

function isCalloutKind(value: string): value is CalloutKind {
  return Object.hasOwn(CALLOUT_LABELS, value)
}

function parseCalloutChildren(children: ReactNode): ParsedCallout | null {
  const nodes = Children.toArray(children)
  const firstNodeIndex = nodes.findIndex((node) => textFromNode(node).trim().length > 0)
  const firstNode = nodes[firstNodeIndex]
  if (firstNode === undefined) {
    return null
  }

  const firstText = textFromNode(firstNode).trimStart()
  const [firstLine = "", ...bodyLines] = firstText.split(/\r?\n/)
  const marker = parseCalloutMarker(firstLine)

  if (marker === null) {
    return null
  }

  return {
    bodyText: bodyLines.join("\n").trim(),
    marker,
    rest: nodes.slice(firstNodeIndex + 1),
  }
}

function textFromNode(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
  }
  if (Array.isArray(node)) {
    return node.map(textFromNode).join("")
  }
  if (isValidElement<{ readonly children?: ReactNode }>(node)) {
    return textFromNode(node.props.children)
  }
  return ""
}

function CalloutBlock({ callout }: { readonly callout: ParsedCallout }) {
  const title = callout.marker.title || CALLOUT_LABELS[callout.marker.kind]
  const className = `markdown-callout markdown-callout-${callout.marker.kind}`

  if (callout.marker.fold !== "none") {
    return (
      <details className={className} open={callout.marker.fold === "open"}>
        <summary className="markdown-callout-title">{title}</summary>
        <div className="markdown-callout-body">
          <CalloutBody callout={callout} />
        </div>
      </details>
    )
  }

  return (
    <aside className={className}>
      <div className="markdown-callout-title">{title}</div>
      <div className="markdown-callout-body">
        <CalloutBody callout={callout} />
      </div>
    </aside>
  )
}

function CalloutBody({ callout }: { readonly callout: ParsedCallout }) {
  return (
    <>
      {callout.bodyText.length > 0 ? <p>{callout.bodyText}</p> : null}
      {callout.rest}
    </>
  )
}
