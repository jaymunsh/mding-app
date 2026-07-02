import {
  Children,
  type CSSProperties,
  isValidElement,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import type { ThemedToken } from "shiki"

type MarkdownPreviewProps = {
  readonly markdown: string
}

type MermaidDiagramProps = {
  readonly chart: string
}

type MermaidApi = typeof import("mermaid").default
type MermaidColorMode = "dark" | "light"

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

const CODE_LANGUAGE_MAP: Readonly<Record<string, string>> = {
  bash: "bash",
  css: "css",
  go: "go",
  html: "html",
  javascript: "javascript",
  js: "javascript",
  json: "json",
  jsx: "jsx",
  markdown: "markdown",
  md: "markdown",
  plaintext: "text",
  py: "python",
  python: "python",
  rust: "rust",
  sh: "bash",
  shell: "bash",
  sql: "sql",
  swift: "swift",
  text: "text",
  ts: "typescript",
  tsx: "tsx",
  typescript: "typescript",
  yaml: "yaml",
  yml: "yaml",
} as const

type CalloutKind = keyof typeof CALLOUT_LABELS
type CalloutFold = "none" | "open" | "closed"
type ShikiHighlighter = Awaited<ReturnType<typeof import("shiki/core").createHighlighterCore>>

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

type HighlightedToken = {
  readonly id: string
  readonly token: ThemedToken
}

type HighlightedLine = {
  readonly id: string
  readonly tokens: readonly HighlightedToken[]
}

let mermaidApiPromise: Promise<MermaidApi> | null = null
let shikiHighlighterPromise: Promise<ShikiHighlighter> | null = null

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

function HighlightedCode({
  className,
  language,
  source,
}: {
  readonly className: string | undefined
  readonly language: string
  readonly source: string
}) {
  const [lines, setLines] = useState<readonly HighlightedLine[] | null>(null)

  useEffect(() => {
    let cancelled = false

    async function highlight(): Promise<void> {
      try {
        const shiki = await loadShiki()
        const result = await shiki.codeToTokens(source, {
          lang: normalizeCodeLanguage(language),
          theme: "github-dark",
        })
        if (!cancelled) {
          setLines(toHighlightedLines(result.tokens))
        }
      } catch {
        if (!cancelled) {
          setLines(null)
        }
      }
    }

    void highlight()

    return () => {
      cancelled = true
    }
  }, [language, source])

  if (lines === null) {
    return <code className={className}>{source}</code>
  }

  return (
    <code className={`${className ?? ""} shiki-code`.trim()}>
      {lines.map((line) => (
        <span className="shiki-line" key={line.id}>
          {line.tokens.map(({ id, token }) => (
            <span key={id} style={styleForToken(token)}>
              {token.content}
            </span>
          ))}
          {line.id !== lines[lines.length - 1]?.id ? "\n" : null}
        </span>
      ))}
    </code>
  )
}

function toHighlightedLines(
  lines: readonly (readonly ThemedToken[])[],
): readonly HighlightedLine[] {
  const highlightedLines: HighlightedLine[] = []

  for (const [lineNumber, line] of lines.entries()) {
    const lineId =
      line[0]?.offset === undefined ? `blank-line-${lineNumber}` : `line-${line[0].offset}`
    highlightedLines.push({
      id: lineId,
      tokens: line.map((token) => ({
        id: `token-${token.offset}-${token.content}`,
        token,
      })),
    })
  }

  return highlightedLines
}

function normalizeCodeLanguage(language: string): string {
  return CODE_LANGUAGE_MAP[language] ?? "text"
}

function styleForToken(token: ThemedToken): CSSProperties {
  const style: CSSProperties = {}
  if (token.color !== undefined) {
    style.color = token.color
  }
  return style
}

function loadShiki(): Promise<ShikiHighlighter> {
  if (shikiHighlighterPromise === null) {
    shikiHighlighterPromise = Promise.all([
      import("shiki/core"),
      import("shiki/engine/oniguruma"),
      import("shiki/dist/themes/github-dark.mjs"),
      import("shiki/dist/langs/bash.mjs"),
      import("shiki/dist/langs/css.mjs"),
      import("shiki/dist/langs/go.mjs"),
      import("shiki/dist/langs/html.mjs"),
      import("shiki/dist/langs/javascript.mjs"),
      import("shiki/dist/langs/json.mjs"),
      import("shiki/dist/langs/jsx.mjs"),
      import("shiki/dist/langs/markdown.mjs"),
      import("shiki/dist/langs/python.mjs"),
      import("shiki/dist/langs/rust.mjs"),
      import("shiki/dist/langs/sql.mjs"),
      import("shiki/dist/langs/swift.mjs"),
      import("shiki/dist/langs/tsx.mjs"),
      import("shiki/dist/langs/typescript.mjs"),
      import("shiki/dist/langs/yaml.mjs"),
    ]).then(
      ([
        core,
        engine,
        githubDark,
        bash,
        css,
        go,
        html,
        javascript,
        json,
        jsx,
        markdown,
        python,
        rust,
        sql,
        swift,
        tsx,
        typescript,
        yaml,
      ]) =>
        core.createHighlighterCore({
          engine: engine.createOnigurumaEngine(import("shiki/wasm")),
          langs: [
            bash.default,
            css.default,
            go.default,
            html.default,
            javascript.default,
            json.default,
            jsx.default,
            markdown.default,
            python.default,
            rust.default,
            sql.default,
            swift.default,
            tsx.default,
            typescript.default,
            yaml.default,
          ],
          themes: [githubDark.default],
        }),
    )
  }
  return shikiHighlighterPromise
}

function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const id = useStableMermaidId()
  const colorMode = useMermaidColorMode()
  const containerRef = useRef<HTMLDivElement>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function renderDiagram(): Promise<void> {
      try {
        const mermaid = await loadMermaid()
        mermaid.initialize(createMermaidConfig(colorMode))
        const { svg } = await mermaid.render(`${id}-${colorMode}`, chart)
        if (!cancelled && containerRef.current !== null) {
          containerRef.current.innerHTML = svg
          setErrorMessage(null)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(messageFromError(error))
        }
      }
    }

    void renderDiagram()

    return () => {
      cancelled = true
    }
  }, [chart, colorMode, id])

  if (errorMessage !== null) {
    return (
      <pre className="mermaid-error">
        <code>{errorMessage}</code>
      </pre>
    )
  }

  return (
    <div ref={containerRef} className="mermaid-diagram" role="img" aria-label="Mermaid diagram" />
  )
}

function loadMermaid(): Promise<MermaidApi> {
  if (mermaidApiPromise === null) {
    mermaidApiPromise = import("mermaid").then((module) => {
      module.default.initialize(createMermaidConfig(readMermaidColorMode()))
      return module.default
    })
  }
  return mermaidApiPromise
}

function createMermaidConfig(colorMode: MermaidColorMode) {
  const isDark = colorMode === "dark"

  return {
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",
    themeVariables: {
      background: isDark ? "#0c0d0b" : "#ffffff",
      darkMode: isDark,
      edgeLabelBackground: isDark ? "#191a17" : "#ffffff",
      lineColor: isDark ? "#a9ada1" : "#65685f",
      mainBkg: isDark ? "#191a17" : "#ffffff",
      nodeBorder: isDark ? "#60b49d" : "#2f6f5e",
      nodeTextColor: isDark ? "#f3f4ed" : "#181916",
      primaryBorderColor: isDark ? "#60b49d" : "#2f6f5e",
      primaryColor: isDark ? "#1f3f37" : "#e8f3ee",
      primaryTextColor: isDark ? "#f3f4ed" : "#181916",
      secondaryColor: isDark ? "#22231f" : "#efefeb",
      tertiaryColor: isDark ? "#111210" : "#f7f7f4",
      textColor: isDark ? "#f3f4ed" : "#181916",
    },
  } as const
}

function useMermaidColorMode(): MermaidColorMode {
  const [colorMode, setColorMode] = useState(readMermaidColorMode)

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const updateColorMode = () => setColorMode(readMermaidColorMode())
    const observer = new MutationObserver(updateColorMode)

    observer.observe(document.documentElement, {
      attributeFilter: ["data-theme"],
      attributes: true,
    })
    media.addEventListener("change", updateColorMode)

    return () => {
      observer.disconnect()
      media.removeEventListener("change", updateColorMode)
    }
  }, [])

  return colorMode
}

function readMermaidColorMode(): MermaidColorMode {
  const theme = document.documentElement.getAttribute("data-theme")
  if (theme === "dark") {
    return "dark"
  }
  if (theme === "light") {
    return "light"
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function useStableMermaidId(): string {
  return `mding-mermaid-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
}

function messageFromError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return "Unable to render Mermaid diagram."
}
