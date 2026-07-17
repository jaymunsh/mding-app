import { mkdir, writeFile } from "node:fs/promises"
import { chromium } from "playwright"

const baseUrl = process.env.PWA_BASE_URL ?? "http://127.0.0.1:4173/"
const evidenceDir = process.env.PWA_EVIDENCE_DIR ?? "docs/verification/pwa-screenshots"
const guideCopy = {
  en: {
    guide: "Guide",
    more: "More actions",
    dialog: "Quick guide",
    close: "Close guide",
    workspaceTitle: "Shortcuts and focus",
    pins: "pinned shortcuts",
    namedCreation: "enter a name",
    dragFeedback: "success message appears only after the move is saved",
    invalidDrops: "Invalid drops",
    focusExits: "iOS edge swipe",
    editorGuardrail: "preview-only; switch out of Edit mode",
  },
  ko: {
    guide: "가이드",
    more: "더보기",
    dialog: "빠른 가이드",
    close: "가이드 닫기",
    workspaceTitle: "바로가기와 집중 읽기",
    pins: "고정 바로가기",
    namedCreation: "이름을 입력",
    dragFeedback: "성공 메시지가 표시",
    invalidDrops: "이동 성공 메시지도 표시하지 않습니다",
    focusExits: "iOS 가장자리 스와이프",
    editorGuardrail: "편집 모드에서는 시작할 수 없습니다",
  },
}

async function capture(viewport, name) {
  const browser = await chromium.launch({ channel: "chrome" })
  const page = await browser.newPage({ viewport })
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.getByText("markdown-example.md").click()
  await openDocumentTools(page)
  await page
    .getByRole("dialog", { name: "Document tools" })
    .getByRole("button", {
      name: "Edit",
      exact: true,
    })
    .click()
  await page.locator("textarea").fill(`# ${name}\n\nEdited from Playwright visual QA.`)
  await page.getByRole("button", { name: "Save", exact: true }).click()
  await openDocumentTools(page)
  await page
    .getByRole("dialog", { name: "Document tools" })
    .getByRole("button", {
      name: "Edit",
      exact: true,
    })
    .waitFor()
  await page.screenshot({ path: `${evidenceDir}/${name}.png`, fullPage: true })
  await browser.close()
}

await mkdir(evidenceDir, { recursive: true })
await capture({ width: 390, height: 844 }, "mobile")
await capture({ width: 820, height: 1180 }, "tablet")
await capture({ width: 1440, height: 960 }, "macos-wide")
await verifyScrollingAndTheme()
await verifyBilingualGuide()

console.log(`visual QA screenshots written to ${evidenceDir}`)

async function openSettings(page) {
  await page.getByRole("button", { name: "Settings" }).click()
  await page.getByRole("dialog", { name: "Settings" }).waitFor()
}

async function openDocumentTools(page) {
  await page.getByRole("button", { name: "Document tools", exact: true }).click()
  await page.getByRole("dialog", { name: "Document tools" }).waitFor()
}

async function verifyScrollingAndTheme() {
  const browser = await chromium.launch({ channel: "chrome" })
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
  await page.locator(".markdown-preview hr").waitFor()
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

  await openDocumentTools(page)
  await page
    .getByRole("dialog", { name: "Document tools" })
    .getByRole("button", {
      name: "Edit",
      exact: true,
    })
    .click()
  const editorHeight = await page.locator("textarea").evaluate((element) => element.clientHeight)
  if (editorHeight < 500) {
    throw new Error(`Markdown source editor is too short: ${editorHeight}px.`)
  }

  await browser.close()
}

async function verifyBilingualGuide() {
  const reportPath = `${evidenceDir}/guide-bilingual.json`
  const guideViewports = [
    { name: "desktop", viewport: { width: 1440, height: 960 } },
    { name: "mobile", viewport: { width: 390, height: 844 } },
  ]
  const report = {
    scenario: "Quick Guide covers Todo 7 features in both languages at desktop and mobile widths",
    invocation: `PWA_BASE_URL=${baseUrl} PWA_EVIDENCE_DIR=${evidenceDir} npm run qa:visual`,
    viewports: {},
    screenshots: {},
    staleLanguageFallback: false,
    checksPassed: 0,
    checksTotal: 0,
    pass: false,
  }
  const browser = await chromium.launch({ channel: "chrome" })

  try {
    for (const { name, viewport } of guideViewports) {
      const context = await browser.newContext({ viewport, colorScheme: "light" })
      await context.addInitScript(() => {
        localStorage.setItem("mding.language", "stale-language")
        localStorage.setItem("mding.theme", "light")
      })
      const page = await context.newPage()

      await page.goto(baseUrl, { waitUntil: "networkidle" })
      const englishGuide = await openGuide(page, "en")
      const englishResult = await inspectGuide(englishGuide, "en", viewport.width)
      const englishScreenshots = {
        top: `${evidenceDir}/guide-${name}-english-top.png`,
        middle: `${evidenceDir}/guide-${name}-english-middle.png`,
        bottom: `${evidenceDir}/guide-${name}-english-bottom.png`,
      }
      await page.screenshot({ path: englishScreenshots.top, fullPage: false })
      await scrollGuideToMiddle(englishGuide)
      await page.screenshot({ path: englishScreenshots.middle, fullPage: false })
      await scrollGuideToBottom(englishGuide)
      await page.screenshot({ path: englishScreenshots.bottom, fullPage: false })
      await englishGuide.getByRole("button", { name: "Close guide", exact: true }).click()

      await openSettings(page)
      await page
        .getByRole("dialog", { name: "Settings" })
        .getByRole("button", { name: "Use Korean", exact: true })
        .click()
      await page.locator(".settings-trigger").click()

      const koreanGuide = await openGuide(page, "ko")
      const koreanResult = await inspectGuide(koreanGuide, "ko", viewport.width)
      const koreanScreenshots = {
        top: `${evidenceDir}/guide-${name}-korean-top.png`,
        middle: `${evidenceDir}/guide-${name}-korean-middle.png`,
        bottom: `${evidenceDir}/guide-${name}-korean-bottom.png`,
      }
      await page.screenshot({ path: koreanScreenshots.top, fullPage: false })
      await scrollGuideToMiddle(koreanGuide)
      await page.screenshot({ path: koreanScreenshots.middle, fullPage: false })
      await scrollGuideToBottom(koreanGuide)
      await page.screenshot({ path: koreanScreenshots.bottom, fullPage: false })

      const viewportChecks = [
        ...Object.values(englishResult.checks),
        ...Object.values(koreanResult.checks),
      ]
      report.checksPassed += viewportChecks.filter(Boolean).length
      report.checksTotal += viewportChecks.length
      report.staleLanguageFallback = true
      report.viewports[name] = {
        viewport,
        english: englishResult,
        korean: koreanResult,
      }
      report.screenshots[name] = {
        english: englishScreenshots,
        korean: koreanScreenshots,
      }

      await context.close()
    }
    report.pass = report.staleLanguageFallback && report.checksPassed === report.checksTotal
  } catch (error) {
    report.error = error instanceof Error ? error.message : String(error)
  } finally {
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8")
    await browser.close()
  }

  if (!report.pass) {
    throw new Error(`Bilingual Quick Guide verification failed; see ${reportPath}.`)
  }
  console.log(`bilingual guide checks passed: ${report.checksPassed}/${report.checksTotal}`)
}

async function inspectGuide(guide, language, viewportWidth) {
  const copy = guideCopy[language]
  const guideText = (await guide.textContent()) ?? ""
  const workspaceSection = guide
    .getByRole("heading", { name: copy.workspaceTitle, exact: true })
    .locator("..")
  const workspaceItemCount = await workspaceSection.locator("li").count()
  const layout = await guide.evaluate((element) => {
    const content = element.querySelector(".help-content")
    if (!(content instanceof HTMLElement)) {
      return {
        contentScrollWidth: 0,
        contentClientWidth: 0,
        documentScrollWidth: 0,
        clippedNodes: 1,
      }
    }
    const copyNodes = Array.from(
      element.querySelectorAll(".help-toolbar-item > span:last-child, .help-section li"),
    )
    const clippedNodes = copyNodes.filter(
      (node) => node instanceof HTMLElement && node.scrollWidth > node.clientWidth + 1,
    ).length
    return {
      contentScrollWidth: content.scrollWidth,
      contentClientWidth: content.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      clippedNodes,
    }
  })
  const checks = {
    pins: guideText.includes(copy.pins),
    namedCreation: guideText.includes(copy.namedCreation),
    dragFeedback: guideText.includes(copy.dragFeedback),
    invalidDrops: guideText.includes(copy.invalidDrops),
    focusExits: guideText.includes(copy.focusExits),
    editorGuardrail: guideText.includes(copy.editorGuardrail),
    workspaceItems: workspaceItemCount === 6,
    noHorizontalOverflow:
      layout.contentScrollWidth <= layout.contentClientWidth + 1 &&
      layout.documentScrollWidth <= viewportWidth + 1,
    noClippedCopy: layout.clippedNodes === 0,
  }
  return { checks, workspaceItemCount, layout }
}

async function scrollGuideToBottom(guide) {
  await guide.locator(".help-content").evaluate((element) => {
    if (element instanceof HTMLElement) {
      element.scrollTop = element.scrollHeight
    }
  })
}

async function scrollGuideToMiddle(guide) {
  await guide.locator(".help-content").evaluate((element) => {
    if (element instanceof HTMLElement) {
      element.scrollTop = Math.floor((element.scrollHeight - element.clientHeight) / 2)
    }
  })
}

async function openGuide(page, language) {
  const labels = guideCopy[language]
  const directGuide = page.getByRole("button", { name: labels.guide, exact: true })

  if (await directGuide.isVisible()) {
    await directGuide.click()
  } else {
    await page.getByRole("button", { name: labels.more, exact: true }).click()
    await page
      .getByRole("dialog", { name: labels.more })
      .getByRole("button", {
        name: labels.guide,
        exact: true,
      })
      .click()
  }

  return page.getByRole("dialog", { name: labels.dialog })
}
