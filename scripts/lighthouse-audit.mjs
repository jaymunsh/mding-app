import * as chromeLauncher from "chrome-launcher"
import lighthouse from "lighthouse"

const url = process.env.PWA_BASE_URL ?? "http://127.0.0.1:4173/"

async function audit(formFactor) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless=new", "--no-sandbox"],
  })

  try {
    const result = await lighthouse(
      url,
      {
        port: chrome.port,
        logLevel: "error",
      },
      {
        extends: "lighthouse:default",
        settings: {
          formFactor,
          onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
          screenEmulation:
            formFactor === "desktop"
              ? { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1 }
              : undefined,
          throttling:
            formFactor === "desktop"
              ? { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 }
              : undefined,
        },
      },
    )
    const categories = result.lhr.categories
    const scores = {
      performance: Math.round((categories.performance?.score ?? 0) * 100),
      accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((categories["best-practices"]?.score ?? 0) * 100),
      seo: Math.round((categories.seo?.score ?? 0) * 100),
    }
    const failingAudits = Object.entries(result.lhr.audits)
      .filter((entry) => {
        const score = entry[1].score
        return typeof score === "number" && score < 1
      })
      .map((entry) => ({
        id: entry[0],
        title: entry[1].title,
        score: entry[1].score,
      }))
    return { scores, failingAudits }
  } finally {
    await chrome.kill()
  }
}

const mobile = await audit("mobile")
const desktop = await audit("desktop")
console.log(JSON.stringify({ mobile, desktop }, null, 2))
