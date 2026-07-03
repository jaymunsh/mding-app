import { type CSSProperties, useEffect, useState } from "react"
import type { ThemedToken } from "shiki"

const CODE_LANGUAGE_MAP: Readonly<Record<string, string>> = {
  bash: "bash",
  css: "css",
  go: "go",
  html: "html",
  java: "java",
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

type ShikiHighlighter = Awaited<ReturnType<typeof import("shiki/core").createHighlighterCore>>

type HighlightedToken = {
  readonly id: string
  readonly token: ThemedToken
}

type HighlightedLine = {
  readonly id: string
  readonly tokens: readonly HighlightedToken[]
}

let shikiHighlighterPromise: Promise<ShikiHighlighter> | null = null

export function HighlightedCode({
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

export function normalizeCodeLanguage(language: string): string {
  return CODE_LANGUAGE_MAP[language] ?? "text"
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
      import("shiki/dist/langs/java.mjs"),
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
        java,
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
            java.default,
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
