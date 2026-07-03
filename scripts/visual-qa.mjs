import { mkdir } from "node:fs/promises"
import { chromium } from "playwright"

const baseUrl = process.env.PWA_BASE_URL ?? "http://127.0.0.1:4173/"
const evidenceDir = "docs/verification/pwa-screenshots"

async function capture(viewport, name) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport })
  await page.goto(baseUrl)
  await page.getByText("markdown-example.md").click()
  await page.getByRole("button", { name: "Edit", exact: true }).click()
  await page.locator("textarea").fill(`# ${name}\n\nEdited from Playwright visual QA.`)
  await page.getByRole("button", { name: "Save", exact: true }).click()
  await page.getByRole("button", { name: "Edit", exact: true }).waitFor()
  await page.screenshot({ path: `${evidenceDir}/${name}.png`, fullPage: true })
  await browser.close()
}

await mkdir(evidenceDir, { recursive: true })
await capture({ width: 390, height: 844 }, "mobile")
await capture({ width: 820, height: 1180 }, "tablet")
await capture({ width: 1440, height: 960 }, "macos-wide")
await verifyScrollingAndTheme()

console.log(`visual QA screenshots written to ${evidenceDir}`)

async function openSettings(page) {
  await page.getByRole("button", { name: "Settings" }).click()
  await page.getByRole("dialog", { name: "Settings" }).waitFor()
}

async function verifyScrollingAndTheme() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page.goto(baseUrl)

  await openSettings(page)
  await page.getByRole("button", { name: "Use dark theme" }).click()
  await page.getByRole("button", { name: "Use light theme" }).click()
  const lightTheme = await page.evaluate(() => ({
    theme: document.documentElement.getAttribute("data-theme"),
    colorScheme: getComputedStyle(document.documentElement).colorScheme,
  }))
  if (lightTheme.theme !== "light" || lightTheme.colorScheme !== "light") {
    throw new Error("Light theme did not apply after selecting the light theme button.")
  }
  await page.getByRole("button", { name: "Use dark theme" }).click()
  const darkTheme = await page.evaluate(() => ({
    theme: document.documentElement.getAttribute("data-theme"),
    colorScheme: getComputedStyle(document.documentElement).colorScheme,
  }))
  if (darkTheme.theme !== "dark" || darkTheme.colorScheme !== "dark") {
    throw new Error("Dark theme did not apply before renderer checks.")
  }
  await page.getByRole("button", { name: "Settings" }).click()

  const longMarkdown = Array.from(
    { length: 90 },
    (_, index) => `## Section ${index + 1}\n\nContent line ${index + 1}.`,
  ).join("\n\n")
  const markdown = `# Renderer check

**Bold text**

Inline \`code\`

![Inline image](/icons/pwa-192x192.png)

---

> [!NOTE] Callout title
> Callout body

> [!WARNING]- Folded warning
> Folded body

\`\`\`ts
const value: number = 1
\`\`\`

\`\`\`mermaid
graph TD
  A[Start] --> B[Done]
\`\`\`

${longMarkdown}`
  await page.locator("input[aria-label='Import Markdown or HTML files']").setInputFiles({
    name: "long.md",
    mimeType: "text/markdown",
    buffer: Buffer.from(markdown),
  })
  await page.getByText("long.md").click()
  await page.locator(".markdown-body strong", { hasText: "Bold text" }).waitFor()
  await page.locator("hr").waitFor()
  await page.locator(".markdown-body img").waitFor()
  await page.locator(".markdown-callout-note", { hasText: "Callout title" }).waitFor()
  await page.locator("details.markdown-callout-warning", { hasText: "Folded warning" }).waitFor()
  await page.locator(".shiki-code").waitFor()
  await page.locator(".mermaid-diagram svg").waitFor()
  const inlineCodeStyle = await page
    .locator(".markdown-body p code")
    .first()
    .evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        background: style.backgroundColor,
        color: style.color,
      }
    })
  if (inlineCodeStyle.background === "rgba(0, 0, 0, 0)") {
    throw new Error("Inline code does not have a visible background.")
  }
  const mermaidTextFill = await page
    .locator(".mermaid-diagram svg")
    .first()
    .evaluate((element) => getComputedStyle(element).fill)
  if (mermaidTextFill === "rgb(0, 0, 0)" || mermaidTextFill === "rgba(0, 0, 0, 0)") {
    throw new Error(`Mermaid text fill is not readable in dark mode: ${mermaidTextFill}.`)
  }

  const preview = page.locator(".markdown-preview")
  const canScroll = await preview.evaluate((element) => element.scrollHeight > element.clientHeight)
  if (!canScroll) {
    throw new Error("Markdown preview is not scrollable for a long imported document.")
  }

  await preview.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  const scrollTop = await preview.evaluate((element) => element.scrollTop)
  if (scrollTop <= 0) {
    throw new Error("Markdown preview did not retain a positive scrollTop.")
  }

  await page.getByRole("button", { name: "Edit", exact: true }).click()
  const editorHeight = await page.locator("textarea").evaluate((element) => element.clientHeight)
  if (editorHeight < 500) {
    throw new Error(`Markdown source editor is too short: ${editorHeight}px.`)
  }

  await browser.close()
}
